import { create } from 'zustand';

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentState {
  students: Student[];
  loading: boolean;
  error: string | null;
  loadStudents: (classId: string) => Promise<void>;
  createStudent: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  searchStudents: (classId: string, query: string) => Promise<Student[]>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  loading: false,
  error: null,

  loadStudents: async (classId: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with student-service in Wave 3
      set({ students: [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createStudent: async (data) => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with student-service in Wave 3
      const newStudent: Student = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        students: [...state.students, newStudent],
        loading: false,
      }));
      return newStudent;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateStudent: async (id: string, data: Partial<Student>) => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with student-service in Wave 3
      const updatedStudent = {
        ...get().students.find((s) => s.id === id)!,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updatedStudent : s)),
        loading: false,
      }));
      return updatedStudent;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteStudent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with student-service in Wave 3
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  searchStudents: async (classId: string, query: string) => {
    // TODO: Integrate with student-service in Wave 3
    const students = get().students;
    const lowerQuery = query.toLowerCase();
    return students.filter(
      (s) =>
        s.classId === classId &&
        (s.name.toLowerCase().includes(lowerQuery) ||
          s.rollNumber.toLowerCase().includes(lowerQuery))
    );
  },
}));
