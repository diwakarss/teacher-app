import { create } from 'zustand';
import {
  lessonPlanService,
  type GenerateLessonPlanParams,
  type LessonPlanWithParsed,
} from '@/services/lesson-plan-service';
import {
  questionPaperService,
  type GenerateQuestionPaperParams,
  type QuestionPaperWithParsed,
} from '@/services/question-paper-service';
import { initializeDb } from '@/lib/db/database';
import type { LessonPlan, QuestionPaper } from '@/lib/db/schema';
import type { LessonPlanOutput } from '@/lib/prompts/lesson-plan-prompt';
import type { QuestionPaperOutput } from '@/lib/prompts/question-paper-prompt';
import { resolveAllImages } from '@/lib/image-resolver';

interface GenerationState {
  // Lesson Plans
  lessonPlans: LessonPlan[];
  currentLessonPlan: LessonPlanWithParsed | null;
  pendingLessonPlan: LessonPlanOutput | null;
  pendingLessonPlanParams: GenerateLessonPlanParams | null;

  // Question Papers
  questionPapers: QuestionPaper[];
  currentQuestionPaper: QuestionPaperWithParsed | null;
  pendingQuestionPaper: QuestionPaperOutput | null;
  pendingQuestionPaperParams: GenerateQuestionPaperParams | null;

  // Loading states
  loading: boolean;
  generating: boolean;
  error: string | null;

  // Lesson Plan actions
  loadLessonPlans: (subjectId?: string) => Promise<void>;
  loadLessonPlansByChapter: (chapterId: string) => Promise<void>;
  loadLessonPlanById: (id: string) => Promise<void>;
  generateLessonPlan: (params: GenerateLessonPlanParams) => Promise<void>;
  savePendingLessonPlan: () => Promise<LessonPlan>;
  updateLessonPlan: (
    id: string,
    data: Partial<LessonPlan>
  ) => Promise<LessonPlan>;
  deleteLessonPlan: (id: string) => Promise<void>;

  // Question Paper actions
  loadQuestionPapers: (subjectId?: string) => Promise<void>;
  loadQuestionPaperById: (id: string) => Promise<void>;
  generateQuestionPaper: (params: GenerateQuestionPaperParams) => Promise<void>;
  savePendingQuestionPaper: () => Promise<QuestionPaper>;
  updateQuestionPaper: (
    id: string,
    data: Partial<QuestionPaper>
  ) => Promise<QuestionPaper>;
  deleteQuestionPaper: (id: string) => Promise<void>;

  // Shared actions
  clearPending: () => void;
  clearError: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  // Lesson Plans
  lessonPlans: [],
  currentLessonPlan: null,
  pendingLessonPlan: null,
  pendingLessonPlanParams: null,

  // Question Papers
  questionPapers: [],
  currentQuestionPaper: null,
  pendingQuestionPaper: null,
  pendingQuestionPaperParams: null,

  // Loading states
  loading: false,
  generating: false,
  error: null,

  loadLessonPlans: async (subjectId?: string) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const plans = subjectId
        ? await lessonPlanService.getBySubjectId(subjectId)
        : await lessonPlanService.getAll();
      set({ lessonPlans: plans, loading: false });
    } catch (error) {
      console.error('Failed to load lesson plans:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  loadLessonPlansByChapter: async (chapterId: string) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const plans = await lessonPlanService.getByChapterId(chapterId);
      set({ lessonPlans: plans, loading: false });
    } catch (error) {
      console.error('Failed to load lesson plans:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  loadLessonPlanById: async (id: string) => {
    set({ loading: true, error: null, currentLessonPlan: null });
    try {
      await initializeDb();
      const plan = await lessonPlanService.getById(id);
      if (!plan) {
        throw new Error('Lesson plan not found');
      }
      const parsed = lessonPlanService.parsePlan(plan);
      set({ currentLessonPlan: parsed, loading: false });
    } catch (error) {
      console.error('Failed to load lesson plan:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  generateLessonPlan: async (params: GenerateLessonPlanParams) => {
    set({ generating: true, error: null, pendingLessonPlan: null });
    try {
      const output = await lessonPlanService.generate(params);
      set({
        pendingLessonPlan: output,
        pendingLessonPlanParams: params,
        generating: false,
      });
    } catch (error) {
      console.error('Failed to generate lesson plan:', error);
      set({ error: (error as Error).message, generating: false });
      throw error;
    }
  },

  savePendingLessonPlan: async () => {
    const { pendingLessonPlan, pendingLessonPlanParams } = get();
    if (!pendingLessonPlan || !pendingLessonPlanParams) {
      throw new Error('No pending lesson plan to save');
    }

    set({ loading: true, error: null });
    try {
      await initializeDb();
      const saved = await lessonPlanService.saveGenerated(
        pendingLessonPlanParams,
        pendingLessonPlan
      );
      set((state) => ({
        lessonPlans: [saved, ...state.lessonPlans],
        pendingLessonPlan: null,
        pendingLessonPlanParams: null,
        loading: false,
      }));
      return saved;
    } catch (error) {
      console.error('Failed to save lesson plan:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateLessonPlan: async (id: string, data: Partial<LessonPlan>) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const updated = await lessonPlanService.update(id, data);
      const parsed = lessonPlanService.parsePlan(updated);
      set((state) => ({
        lessonPlans: state.lessonPlans.map((p) => (p.id === id ? updated : p)),
        currentLessonPlan:
          state.currentLessonPlan?.id === id ? parsed : state.currentLessonPlan,
        loading: false,
      }));
      return updated;
    } catch (error) {
      console.error('Failed to update lesson plan:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteLessonPlan: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      await lessonPlanService.delete(id);
      set((state) => ({
        lessonPlans: state.lessonPlans.filter((p) => p.id !== id),
        currentLessonPlan:
          state.currentLessonPlan?.id === id ? null : state.currentLessonPlan,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to delete lesson plan:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Question Paper actions
  loadQuestionPapers: async (subjectId?: string) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const papers = subjectId
        ? await questionPaperService.getBySubjectId(subjectId)
        : await questionPaperService.getAll();
      set({ questionPapers: papers, loading: false });
    } catch (error) {
      console.error('Failed to load question papers:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  loadQuestionPaperById: async (id: string) => {
    set({ loading: true, error: null, currentQuestionPaper: null });
    try {
      await initializeDb();
      const paper = await questionPaperService.getById(id);
      if (!paper) {
        throw new Error('Question paper not found');
      }
      const parsed = questionPaperService.parsePaper(paper);
      set({ currentQuestionPaper: parsed, loading: false });
    } catch (error) {
      console.error('Failed to load question paper:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  generateQuestionPaper: async (params: GenerateQuestionPaperParams) => {
    set({ generating: true, error: null, pendingQuestionPaper: null });
    try {
      const output = await questionPaperService.generate(params);

      // Show paper immediately (images may still be loading)
      set({
        pendingQuestionPaper: output,
        pendingQuestionPaperParams: params,
        generating: false,
      });

      // Resolve images in background (SVG instant, AI images 5-10s each)
      const hasImages = output.sections.some((s) =>
        s.questions.some((q) => q.image && !q.image.svgData && !q.image.base64Data),
      );
      if (hasImages) {
        const resolvedSections = await resolveAllImages(output.sections);
        // Update paper with resolved images (only if still the same paper)
        const current = get().pendingQuestionPaper;
        if (current && current.name === output.name) {
          set({
            pendingQuestionPaper: { ...current, sections: resolvedSections },
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate question paper:', error);
      set({ error: (error as Error).message, generating: false });
      throw error;
    }
  },

  savePendingQuestionPaper: async () => {
    const { pendingQuestionPaper, pendingQuestionPaperParams } = get();
    if (!pendingQuestionPaper || !pendingQuestionPaperParams) {
      throw new Error('No pending question paper to save');
    }

    set({ loading: true, error: null });
    try {
      await initializeDb();
      const saved = await questionPaperService.saveGenerated(
        pendingQuestionPaperParams,
        pendingQuestionPaper
      );
      set((state) => ({
        questionPapers: [saved, ...state.questionPapers],
        pendingQuestionPaper: null,
        pendingQuestionPaperParams: null,
        loading: false,
      }));
      return saved;
    } catch (error) {
      console.error('Failed to save question paper:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateQuestionPaper: async (id: string, data: Partial<QuestionPaper>) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const updated = await questionPaperService.update(id, data);
      const parsed = questionPaperService.parsePaper(updated);
      set((state) => ({
        questionPapers: state.questionPapers.map((p) =>
          p.id === id ? updated : p
        ),
        currentQuestionPaper:
          state.currentQuestionPaper?.id === id
            ? parsed
            : state.currentQuestionPaper,
        loading: false,
      }));
      return updated;
    } catch (error) {
      console.error('Failed to update question paper:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteQuestionPaper: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      await questionPaperService.delete(id);
      set((state) => ({
        questionPapers: state.questionPapers.filter((p) => p.id !== id),
        currentQuestionPaper:
          state.currentQuestionPaper?.id === id
            ? null
            : state.currentQuestionPaper,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to delete question paper:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Shared actions
  clearPending: () => {
    set({
      pendingLessonPlan: null,
      pendingLessonPlanParams: null,
      pendingQuestionPaper: null,
      pendingQuestionPaperParams: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
