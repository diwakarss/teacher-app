import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  feedbackService,
  generateFeedbackWithAI,
  generateFeedbackFromTemplate,
  calculatePerformanceLevel,
  type StudentPerformance,
  type FeedbackTone,
} from '@/services/feedback-service';
import { initializeDb } from '@/lib/db/database';
import { calculateIGCSEGrade } from '@/services/marks-service';
import type { Feedback, Assessment, Student, Mark } from '@/lib/db/schema';

export type { Feedback, StudentPerformance, FeedbackTone };

interface FeedbackState {
  feedbacks: Feedback[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  useAI: boolean;
  setUseAI: (useAI: boolean) => void;
  loadFeedbacks: (assessmentId: string) => Promise<void>;
  generateFeedback: (
    performance: StudentPerformance,
    tone: FeedbackTone,
    assessmentId: string
  ) => Promise<Feedback>;
  generateBulkFeedback: (
    performances: StudentPerformance[],
    tone: FeedbackTone,
    assessmentId: string,
    onProgress?: (current: number, total: number) => void
  ) => Promise<Feedback[]>;
  deleteFeedback: (id: string) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      feedbacks: [],
      loading: false,
      generating: false,
      error: null,
      useAI: false,

      setUseAI: (useAI) => set({ useAI }),

      loadFeedbacks: async (assessmentId: string) => {
        set({ loading: true, error: null });
        try {
          await initializeDb();
          const feedbacks = await feedbackService.getByAssessment(assessmentId);
          set({ feedbacks, loading: false });
        } catch (error) {
          console.error('Failed to load feedbacks:', error);
          set({ error: (error as Error).message, loading: false });
        }
      },

      generateFeedback: async (performance, tone, assessmentId) => {
        const { useAI } = get();

        let message: string;

        if (useAI) {
          try {
            message = await generateFeedbackWithAI(performance, tone);
          } catch (error) {
            console.warn('AI generation failed, falling back to template:', error);
            message = generateFeedbackFromTemplate(performance, tone);
          }
        } else {
          message = generateFeedbackFromTemplate(performance, tone);
        }

        await initializeDb();
        const feedback = await feedbackService.create({
          studentId: performance.studentId,
          assessmentId,
          message,
          tone,
          performanceLevel: performance.performanceLevel,
        });

        set((state) => ({
          feedbacks: [feedback, ...state.feedbacks],
        }));

        return feedback;
      },

      generateBulkFeedback: async (performances, tone, assessmentId, onProgress) => {
        set({ generating: true, error: null });
        const results: Feedback[] = [];

        try {
          // Delete existing feedbacks for this assessment
          await feedbackService.deleteByAssessment(assessmentId);
          set({ feedbacks: [] });

          for (let i = 0; i < performances.length; i++) {
            const feedback = await get().generateFeedback(
              performances[i],
              tone,
              assessmentId
            );
            results.push(feedback);
            onProgress?.(i + 1, performances.length);

            // Small delay to avoid rate limiting if using AI
            if (get().useAI) {
              await new Promise((r) => setTimeout(r, 200));
            }
          }

          set({ generating: false });
          return results;
        } catch (error) {
          console.error('Failed to generate bulk feedback:', error);
          set({ error: (error as Error).message, generating: false });
          throw error;
        }
      },

      deleteFeedback: async (id: string) => {
        try {
          await initializeDb();
          await feedbackService.delete(id);
          set((state) => ({
            feedbacks: state.feedbacks.filter((f) => f.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete feedback:', error);
          set({ error: (error as Error).message });
          throw error;
        }
      },
    }),
    {
      name: 'teacher-app-feedback',
      partialize: (state) => ({
        useAI: state.useAI,
      }),
    }
  )
);

// Helper to build StudentPerformance from raw data
export function buildStudentPerformance(
  student: Student,
  mark: Mark,
  assessment: Assessment,
  subjectName: string,
  allMarks: Mark[]
): StudentPerformance {
  const percentage = (mark.marksObtained / assessment.maxMarks) * 100;
  const grade = calculateIGCSEGrade(mark.marksObtained, assessment.maxMarks);
  const performanceLevel = calculatePerformanceLevel(percentage);

  // Calculate class average
  const classMarks = allMarks.map((m) => (m.marksObtained / assessment.maxMarks) * 100);
  const classAverage = classMarks.length > 0
    ? classMarks.reduce((a, b) => a + b, 0) / classMarks.length
    : 0;

  return {
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    parentName: student.parentName,
    currentMarks: mark.marksObtained,
    maxMarks: assessment.maxMarks,
    grade,
    percentage,
    performanceLevel,
    subjectName,
    assessmentName: assessment.name,
    classAverage,
    trend: 'unknown', // Would need historical data to calculate
  };
}
