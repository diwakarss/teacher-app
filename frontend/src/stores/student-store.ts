import { create } from 'zustand';
import { studentService } from '@/services/student-service';
import { initializeDb } from '@/lib/db/database';
import type { Student } from '@/lib/db/schema';

export type { Student };

interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;
  currentClassId: string | null;
  loadStudents: (classId: string) => Promise<void>;
  createStudent: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  searchStudents: (query: string) => Promise<void>;
  getStudentById: (id: string) => Student | undefined;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  loading: false,
  error: null,
  currentClassId: null,

  loadStudents: async (classId: string) => {
    set({ loading: true, error: null, currentClassId: classId });
    try {
      await initializeDb();
      const students = await studentService.getByClassId(classId);
      set({ students, loading: false });
    } catch (error) {
      console.error('Failed to load students:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  createStudent: async (data) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const newStudent = await studentService.create(data);
      set((state) => ({
        students: [...state.students, newStudent].sort((a, b) =>
          a.rollNumber.localeCompare(b.rollNumber)
        ),
        loading: false,
      }));
      return newStudent;
    } catch (error) {
      console.error('Failed to create student:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateStudent: async (id: string, data: Partial<Student>) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const updatedStudent = await studentService.update(id, data);
      set((state) => ({
        students: state.students
          .map((s) => (s.id === id ? updatedStudent : s))
          .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber)),
        loading: false,
      }));
      return updatedStudent;
    } catch (error) {
      console.error('Failed to update student:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteStudent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      await studentService.delete(id);
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to delete student:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  searchStudents: async (query: string) => {
    const classId = get().currentClassId;
    if (!classId) return;

    set({ loading: true, error: null });
    try {
      await initializeDb();
      const students = query.trim()
        ? await studentService.search(classId, query)
        : await studentService.getByClassId(classId);
      set({ students, loading: false });
    } catch (error) {
      console.error('Failed to search students:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  getStudentById: (id: string) => {
    return get().students.find((s) => s.id === id);
  },
}));
