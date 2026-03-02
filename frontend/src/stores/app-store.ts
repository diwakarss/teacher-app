import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  activeClassId: string | null;
  isOnline: boolean;
  setActiveClass: (classId: string | null) => void;
  setOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeClassId: null,
      isOnline: true,
      setActiveClass: (classId) => set({ activeClassId: classId }),
      setOnline: (online) => set({ isOnline: online }),
    }),
    {
      name: 'teacher-app-state',
      partialize: (state) => ({ activeClassId: state.activeClassId }),
    }
  )
);
