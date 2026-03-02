import { create } from 'zustand';
import { classService } from '@/services/class-service';
import type { Class } from '@/lib/db/schema';

export type { Class };

interface ClassState {
  classes: Class[];
  loading: boolean;
  error: string | null;
  loadClasses: () => Promise<void>;
  createClass: (name: string, academicYear: string) => Promise<Class>;
  updateClass: (id: string, data: Partial<Class>) => Promise<Class>;
  deleteClass: (id: string) => Promise<void>;
  getClassById: (id: string) => Class | undefined;
}

export const useClassStore = create<ClassState>((set, get) => ({
  classes: [],
  loading: false,
  error: null,

  loadClasses: async () => {
    set({ loading: true, error: null });
    try {
      const classes = await classService.getAll();
      set({ classes, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createClass: async (name: string, academicYear: string) => {
    set({ loading: true, error: null });
    try {
      const newClass = await classService.create({ name, academicYear });
      set((state) => ({
        classes: [newClass, ...state.classes],
        loading: false,
      }));
      return newClass;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateClass: async (id: string, data: Partial<Class>) => {
    set({ loading: true, error: null });
    try {
      const updatedClass = await classService.update(id, data);
      set((state) => ({
        classes: state.classes.map((c) => (c.id === id ? updatedClass : c)),
        loading: false,
      }));
      return updatedClass;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteClass: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await classService.delete(id);
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  getClassById: (id: string) => {
    return get().classes.find((c) => c.id === id);
  },
}));
