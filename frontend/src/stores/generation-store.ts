import { create } from 'zustand';
import {
  lessonPlanService,
  type GenerateLessonPlanParams,
  type LessonPlanWithParsed,
} from '@/services/lesson-plan-service';
import { initializeDb } from '@/lib/db/database';
import type { LessonPlan } from '@/lib/db/schema';
import type { LessonPlanOutput } from '@/lib/prompts/lesson-plan-prompt';

interface GenerationState {
  // Lesson Plans
  lessonPlans: LessonPlan[];
  currentLessonPlan: LessonPlanWithParsed | null;
  pendingLessonPlan: LessonPlanOutput | null;
  pendingParams: GenerateLessonPlanParams | null;

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
  clearPending: () => void;
  clearError: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  lessonPlans: [],
  currentLessonPlan: null,
  pendingLessonPlan: null,
  pendingParams: null,
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
        pendingParams: params,
        generating: false,
      });
    } catch (error) {
      console.error('Failed to generate lesson plan:', error);
      set({ error: (error as Error).message, generating: false });
      throw error;
    }
  },

  savePendingLessonPlan: async () => {
    const { pendingLessonPlan, pendingParams } = get();
    if (!pendingLessonPlan || !pendingParams) {
      throw new Error('No pending lesson plan to save');
    }

    set({ loading: true, error: null });
    try {
      await initializeDb();
      const saved = await lessonPlanService.saveGenerated(
        pendingParams,
        pendingLessonPlan
      );
      set((state) => ({
        lessonPlans: [saved, ...state.lessonPlans],
        pendingLessonPlan: null,
        pendingParams: null,
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

  clearPending: () => {
    set({ pendingLessonPlan: null, pendingParams: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
