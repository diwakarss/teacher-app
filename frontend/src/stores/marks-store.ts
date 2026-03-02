import { create } from 'zustand';

export interface Assessment {
  id: string;
  name: string;
  type: 'unit' | 'monthly' | 'term' | 'quiz';
  subjectId: string;
  classId: string;
  maxMarks: number;
  date: string;
  term: number;
  createdAt: string;
  updatedAt: string;
}

export interface Mark {
  id: string;
  studentId: string;
  assessmentId: string;
  marksObtained: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassStats {
  average: number;
  highest: number;
  lowest: number;
  totalStudents: number;
  gradeDistribution: Record<string, number>;
}

interface MarksState {
  assessments: Assessment[];
  marks: Mark[];
  loading: boolean;
  error: string | null;
  loadAssessments: (classId: string) => Promise<void>;
  loadMarks: (assessmentId: string) => Promise<void>;
  setMark: (studentId: string, assessmentId: string, value: number, remarks?: string) => Promise<void>;
  loadStatistics: (assessmentId: string) => Promise<ClassStats | null>;
}

export const useMarksStore = create<MarksState>((set) => ({
  assessments: [],
  marks: [],
  loading: false,
  error: null,

  loadAssessments: async (classId: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with assessment-service in Wave 4
      set({ assessments: [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  loadMarks: async (assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with marks-service in Wave 4
      set({ marks: [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setMark: async (studentId: string, assessmentId: string, value: number, remarks?: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with marks-service in Wave 4
      const newMark: Mark = {
        id: crypto.randomUUID(),
        studentId,
        assessmentId,
        marksObtained: value,
        remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => {
        const existingIndex = state.marks.findIndex(
          (m) => m.studentId === studentId && m.assessmentId === assessmentId
        );
        if (existingIndex >= 0) {
          const updatedMarks = [...state.marks];
          updatedMarks[existingIndex] = { ...updatedMarks[existingIndex], marksObtained: value, remarks };
          return { marks: updatedMarks, loading: false };
        }
        return { marks: [...state.marks, newMark], loading: false };
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  loadStatistics: async (assessmentId: string) => {
    // TODO: Integrate with marks-service in Wave 4
    return null;
  },
}));
