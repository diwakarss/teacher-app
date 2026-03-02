import { create } from 'zustand';
import { chapterService } from '@/services/chapter-service';
import { initializeDb } from '@/lib/db/database';
import type { Chapter } from '@/lib/db/schema';

export type { Chapter };

interface ContentState {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  processingProgress: number;
  currentSubjectId: string | null;

  loadChapters: (subjectId: string) => Promise<void>;
  createChapter: (
    data: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Chapter>;
  updateChapter: (id: string, data: Partial<Chapter>) => Promise<Chapter>;
  deleteChapter: (id: string) => Promise<void>;
  searchChapters: (query: string) => Promise<void>;
  getChapterById: (id: string) => Chapter | undefined;
  setProcessingProgress: (progress: number) => void;
  getNextChapterNumber: () => Promise<number>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  chapters: [],
  loading: false,
  error: null,
  processingProgress: 0,
  currentSubjectId: null,

  loadChapters: async (subjectId: string) => {
    set({ loading: true, error: null, currentSubjectId: subjectId });
    try {
      await initializeDb();
      const chapters = await chapterService.getBySubjectId(subjectId);
      set({ chapters, loading: false });
    } catch (error) {
      console.error('Failed to load chapters:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  createChapter: async (data) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const newChapter = await chapterService.create(data);
      set((state) => ({
        chapters: [...state.chapters, newChapter].sort(
          (a, b) => a.chapterNumber - b.chapterNumber
        ),
        loading: false,
      }));
      return newChapter;
    } catch (error) {
      console.error('Failed to create chapter:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateChapter: async (id: string, data: Partial<Chapter>) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const updatedChapter = await chapterService.update(id, data);
      set((state) => ({
        chapters: state.chapters
          .map((c) => (c.id === id ? updatedChapter : c))
          .sort((a, b) => a.chapterNumber - b.chapterNumber),
        loading: false,
      }));
      return updatedChapter;
    } catch (error) {
      console.error('Failed to update chapter:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteChapter: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      await chapterService.delete(id);
      set((state) => ({
        chapters: state.chapters.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  searchChapters: async (query: string) => {
    const subjectId = get().currentSubjectId;
    if (!subjectId) return;

    set({ loading: true, error: null });
    try {
      await initializeDb();
      const chapters = query.trim()
        ? await chapterService.search(query, subjectId)
        : await chapterService.getBySubjectId(subjectId);
      set({ chapters, loading: false });
    } catch (error) {
      console.error('Failed to search chapters:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  getChapterById: (id: string) => {
    return get().chapters.find((c) => c.id === id);
  },

  setProcessingProgress: (progress: number) => {
    set({ processingProgress: progress });
  },

  getNextChapterNumber: async () => {
    const subjectId = get().currentSubjectId;
    if (!subjectId) return 1;

    try {
      await initializeDb();
      return await chapterService.getNextChapterNumber(subjectId);
    } catch (error) {
      console.error('Failed to get next chapter number:', error);
      return 1;
    }
  },
}));
