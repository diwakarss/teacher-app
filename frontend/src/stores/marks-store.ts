import { create } from 'zustand';
import {
  marksService,
  calculateIGCSEGrade,
  type MarkWithStudent,
} from '@/services/marks-service';
import { initializeDb } from '@/lib/db/database';
import type { Mark, Assessment } from '@/lib/db/schema';

export type { Mark, MarkWithStudent };

export interface ClassStats {
  average: number;
  highest: number;
  lowest: number;
  totalStudents: number;
  gradeDistribution: Record<string, number>;
}

interface MarksState {
  marks: MarkWithStudent[];
  loading: boolean;
  error: string | null;
  currentAssessmentId: string | null;
  loadMarks: (assessmentId: string) => Promise<void>;
  upsertMark: (
    studentId: string,
    assessmentId: string,
    marksObtained: number,
    remarks?: string
  ) => Promise<Mark>;
  bulkUpsert: (
    assessmentId: string,
    entries: { studentId: string; marksObtained: number; remarks?: string }[]
  ) => Promise<void>;
  deleteMark: (id: string) => Promise<void>;
  calculateStats: (assessment: Assessment) => ClassStats | null;
}

export const useMarksStore = create<MarksState>((set, get) => ({
  marks: [],
  loading: false,
  error: null,
  currentAssessmentId: null,

  loadMarks: async (assessmentId: string) => {
    set({ loading: true, error: null, currentAssessmentId: assessmentId });
    try {
      await initializeDb();
      const marks = await marksService.getByAssessment(assessmentId);
      set({ marks, loading: false });
    } catch (error) {
      console.error('Failed to load marks:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  upsertMark: async (
    studentId: string,
    assessmentId: string,
    marksObtained: number,
    remarks?: string
  ) => {
    try {
      await initializeDb();
      const mark = await marksService.upsert(
        studentId,
        assessmentId,
        marksObtained,
        remarks
      );

      // Reload marks for current assessment if it matches
      if (get().currentAssessmentId === assessmentId) {
        const marks = await marksService.getByAssessment(assessmentId);
        set({ marks });
      }

      return mark;
    } catch (error) {
      console.error('Failed to upsert mark:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  bulkUpsert: async (assessmentId, entries) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      await marksService.bulkUpsert(assessmentId, entries);

      // Reload marks for current assessment if it matches
      if (get().currentAssessmentId === assessmentId) {
        const marks = await marksService.getByAssessment(assessmentId);
        set({ marks, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Failed to bulk upsert marks:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteMark: async (id: string) => {
    try {
      await initializeDb();
      await marksService.delete(id);
      set((state) => ({
        marks: state.marks.filter((m) => m.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete mark:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  calculateStats: (assessment: Assessment) => {
    const marks = get().marks;
    if (marks.length === 0) return null;

    const marksValues = marks.map((m) => m.marksObtained);
    const average = marksValues.reduce((a, b) => a + b, 0) / marksValues.length;
    const highest = Math.max(...marksValues);
    const lowest = Math.min(...marksValues);

    const gradeDistribution: Record<string, number> = {};
    marks.forEach((m) => {
      const grade = calculateIGCSEGrade(m.marksObtained, assessment.maxMarks);
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    return {
      average: Math.round(average * 10) / 10,
      highest,
      lowest,
      totalStudents: marks.length,
      gradeDistribution,
    };
  },
}));
