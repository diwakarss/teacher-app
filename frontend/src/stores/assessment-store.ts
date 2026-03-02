import { create } from 'zustand';
import { assessmentService } from '@/services/assessment-service';
import { initializeDb } from '@/lib/db/database';
import type { Assessment } from '@/lib/db/schema';

export type { Assessment };

interface AssessmentState {
  assessments: Assessment[];
  loading: boolean;
  error: string | null;
  currentSubjectId: string | null;
  loadAssessments: (subjectId: string) => Promise<void>;
  loadAssessmentsByClass: (classId: string) => Promise<void>;
  createAssessment: (
    data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Assessment>;
  updateAssessment: (
    id: string,
    data: Partial<Assessment>
  ) => Promise<Assessment>;
  deleteAssessment: (id: string) => Promise<void>;
  getAssessmentById: (id: string) => Assessment | undefined;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assessments: [],
  loading: false,
  error: null,
  currentSubjectId: null,

  loadAssessments: async (subjectId: string) => {
    set({ loading: true, error: null, currentSubjectId: subjectId });
    try {
      await initializeDb();
      const assessments = await assessmentService.getBySubject(subjectId);
      set({ assessments, loading: false });
    } catch (error) {
      console.error('Failed to load assessments:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  loadAssessmentsByClass: async (classId: string) => {
    set({ loading: true, error: null, currentSubjectId: null });
    try {
      await initializeDb();
      const assessments = await assessmentService.getByClass(classId);
      set({ assessments, loading: false });
    } catch (error) {
      console.error('Failed to load assessments:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  createAssessment: async (data) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const newAssessment = await assessmentService.create(data);
      set((state) => ({
        assessments: [newAssessment, ...state.assessments],
        loading: false,
      }));
      return newAssessment;
    } catch (error) {
      console.error('Failed to create assessment:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateAssessment: async (id: string, data: Partial<Assessment>) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const updatedAssessment = await assessmentService.update(id, data);
      set((state) => ({
        assessments: state.assessments.map((a) =>
          a.id === id ? updatedAssessment : a
        ),
        loading: false,
      }));
      return updatedAssessment;
    } catch (error) {
      console.error('Failed to update assessment:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteAssessment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      await assessmentService.delete(id);
      set((state) => ({
        assessments: state.assessments.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to delete assessment:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  getAssessmentById: (id: string) => {
    return get().assessments.find((a) => a.id === id);
  },
}));
