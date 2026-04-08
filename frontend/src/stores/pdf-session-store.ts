import { create } from 'zustand';

interface PdfSessionState {
  fileName: string | null;
  pageCount: number;
  pdfLoaded: boolean;
  setPdfMetadata: (fileName: string, pageCount: number) => void;
  clearPdf: () => void;
}

export const usePdfSessionStore = create<PdfSessionState>((set) => ({
  fileName: null,
  pageCount: 0,
  pdfLoaded: false,
  setPdfMetadata: (fileName: string, pageCount: number) => {
    set({ fileName, pageCount, pdfLoaded: true });
  },
  clearPdf: () => {
    set({ fileName: null, pageCount: 0, pdfLoaded: false });
  },
}));
