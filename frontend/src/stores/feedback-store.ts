import { create } from 'zustand';

export interface FeedbackResult {
  studentId: string;
  studentName: string;
  message: string;
  format: 'sms' | 'whatsapp';
}

interface FeedbackState {
  generatedMessages: Map<string, FeedbackResult>;
  loading: boolean;
  error: string | null;
  generateFeedback: (
    studentId: string,
    assessmentId: string,
    format: 'sms' | 'whatsapp'
  ) => Promise<string>;
  generateClassFeedback: (
    assessmentId: string,
    format: 'sms' | 'whatsapp'
  ) => Promise<FeedbackResult[]>;
  clearFeedback: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  generatedMessages: new Map(),
  loading: false,
  error: null,

  generateFeedback: async (
    studentId: string,
    assessmentId: string,
    format: 'sms' | 'whatsapp'
  ) => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with feedback-service in Wave 5
      const message = 'Feedback will be generated here.';
      const result: FeedbackResult = {
        studentId,
        studentName: 'Student',
        message,
        format,
      };
      set((state) => {
        const newMap = new Map(state.generatedMessages);
        newMap.set(`${studentId}-${assessmentId}`, result);
        return { generatedMessages: newMap, loading: false };
      });
      return message;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  generateClassFeedback: async (assessmentId: string, format: 'sms' | 'whatsapp') => {
    set({ loading: true, error: null });
    try {
      // TODO: Integrate with feedback-service in Wave 5
      set({ loading: false });
      return [];
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  clearFeedback: () => {
    set({ generatedMessages: new Map() });
  },
}));
