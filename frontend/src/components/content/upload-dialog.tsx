'use client';

import { useReducer, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { useContentStore } from '@/stores/content-store';
import { usePdfSessionStore } from '@/stores/pdf-session-store';
import {
  loadPdf,
  renderPageToDataUrl,
  renderPageToBase64,
  isPdfLoaded,
  getCachedPageCount,
} from '@/lib/pdf-extractor';
import { suggestChapterName } from '@/lib/chapter-detector';
import {
  PageReviewPanel,
  type PageExtraction,
  toDisplayString,
} from '@/components/content/page-review-panel';
import { toast } from 'sonner';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}

// State machine for upload flow
type Step = 'select' | 'range' | 'scanning' | 'reviewing';

interface PageData {
  pageNumber: number;
  imageDataUrl: string | null;
  extraction: PageExtraction | null;
  scanning: boolean;
  error: string | null;
}

interface UploadState {
  step: Step;
  chapterName: string;
  chapterNumber: number;
  startPage: number;
  endPage: number;
  progress: number;
  progressText: string;
  pages: PageData[];
  currentPageIndex: number;
  saving: boolean;
}

type UploadAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'SET_CHAPTER_NAME'; name: string }
  | { type: 'SET_CHAPTER_NUMBER'; num: number }
  | { type: 'SET_START_PAGE'; page: number }
  | { type: 'SET_END_PAGE'; page: number }
  | { type: 'SET_PROGRESS'; progress: number; text: string }
  | { type: 'INIT_PAGES'; pages: PageData[] }
  | { type: 'SET_PAGE_IMAGE'; index: number; dataUrl: string }
  | { type: 'SET_PAGE_SCANNING'; index: number; scanning: boolean }
  | { type: 'SET_PAGE_EXTRACTION'; index: number; extraction: PageExtraction }
  | { type: 'SET_PAGE_ERROR'; index: number; error: string }
  | { type: 'EDIT_EXTRACTION'; index: number; extraction: PageExtraction }
  | { type: 'SET_CURRENT_PAGE'; index: number }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'RESET' };

const initialState: UploadState = {
  step: 'select',
  chapterName: '',
  chapterNumber: 1,
  startPage: 1,
  endPage: 1,
  progress: 0,
  progressText: '',
  pages: [],
  currentPageIndex: 0,
  saving: false,
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_CHAPTER_NAME':
      return { ...state, chapterName: action.name };
    case 'SET_CHAPTER_NUMBER':
      return { ...state, chapterNumber: action.num };
    case 'SET_START_PAGE':
      return { ...state, startPage: action.page };
    case 'SET_END_PAGE':
      return { ...state, endPage: action.page };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress, progressText: action.text };
    case 'INIT_PAGES':
      return { ...state, pages: action.pages, currentPageIndex: 0 };
    case 'SET_PAGE_IMAGE': {
      const pages = [...state.pages];
      pages[action.index] = { ...pages[action.index], imageDataUrl: action.dataUrl };
      return { ...state, pages };
    }
    case 'SET_PAGE_SCANNING': {
      const pages = [...state.pages];
      pages[action.index] = { ...pages[action.index], scanning: action.scanning };
      return { ...state, pages };
    }
    case 'SET_PAGE_EXTRACTION': {
      const pages = [...state.pages];
      pages[action.index] = {
        ...pages[action.index],
        extraction: action.extraction,
        scanning: false,
        error: null,
      };
      return { ...state, pages };
    }
    case 'SET_PAGE_ERROR': {
      const pages = [...state.pages];
      pages[action.index] = {
        ...pages[action.index],
        error: action.error,
        scanning: false,
      };
      return { ...state, pages };
    }
    case 'EDIT_EXTRACTION': {
      const pages = [...state.pages];
      pages[action.index] = { ...pages[action.index], extraction: action.extraction };
      return { ...state, pages };
    }
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPageIndex: action.index };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function UploadDialog({ open, onOpenChange, subjectId }: UploadDialogProps) {
  const { createChapter, getNextChapterNumber } = useContentStore();
  const { fileName, pageCount, pdfLoaded, setPdfMetadata, clearPdf } = usePdfSessionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, dispatch] = useReducer(uploadReducer, initialState);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Don't clear PDF cache on close (persist across unit creations)
      dispatch({ type: 'RESET' });
    }
    onOpenChange(newOpen);
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be under 100MB');
      return;
    }

    dispatch({ type: 'SET_PROGRESS', progress: 0, text: 'Loading PDF...' });
    dispatch({ type: 'SET_STEP', step: 'scanning' });

    try {
      const totalPages = await loadPdf(file);
      setPdfMetadata(file.name, totalPages);

      const nextNumber = await getNextChapterNumber();
      const suggestion = suggestChapterName('', file.name, nextNumber);
      dispatch({ type: 'SET_CHAPTER_NAME', name: suggestion.name });
      dispatch({ type: 'SET_CHAPTER_NUMBER', num: suggestion.chapterNumber });
      dispatch({ type: 'SET_START_PAGE', page: 1 });
      dispatch({ type: 'SET_END_PAGE', page: Math.min(totalPages, 30) });
      dispatch({ type: 'SET_STEP', step: 'range' });
    } catch (error) {
      console.error('Failed to load PDF:', error);
      toast.error('Failed to load PDF. Please try again.');
      dispatch({ type: 'RESET' });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseCachedPdf = async () => {
    const nextNumber = await getNextChapterNumber();
    dispatch({ type: 'SET_CHAPTER_NAME', name: '' });
    dispatch({ type: 'SET_CHAPTER_NUMBER', num: nextNumber });
    dispatch({ type: 'SET_START_PAGE', page: 1 });
    dispatch({ type: 'SET_END_PAGE', page: Math.min(pageCount, 30) });
    dispatch({ type: 'SET_STEP', step: 'range' });
  };

  const startScanning = useCallback(async () => {
    const start = state.startPage;
    const end = state.endPage;
    const count = end - start + 1;

    // Initialize page data
    const pages: PageData[] = [];
    for (let i = 0; i < count; i++) {
      pages.push({
        pageNumber: start + i,
        imageDataUrl: null,
        extraction: null,
        scanning: false,
        error: null,
      });
    }
    dispatch({ type: 'INIT_PAGES', pages });
    dispatch({ type: 'SET_STEP', step: 'scanning' });
    dispatch({ type: 'SET_PROGRESS', progress: 0, text: 'Rendering pages...' });

    // Process pages sequentially: render image → scan with AI → next page
    for (let i = 0; i < count; i++) {
      const pageNum = start + i;

      try {
        // Render page image for preview
        dispatch({
          type: 'SET_PROGRESS',
          progress: Math.round(((i * 2) / (count * 2)) * 100),
          text: `Rendering page ${i + 1} of ${count}...`,
        });

        const dataUrl = await renderPageToDataUrl(pageNum, 1.5);
        dispatch({ type: 'SET_PAGE_IMAGE', index: i, dataUrl });

        // Get base64 for API (higher resolution)
        const base64 = await renderPageToBase64(pageNum, 2.0);

        // Scan with Claude Vision
        dispatch({ type: 'SET_PAGE_SCANNING', index: i, scanning: true });
        dispatch({
          type: 'SET_PROGRESS',
          progress: Math.round(((i * 2 + 1) / (count * 2)) * 100),
          text: `Scanning page ${i + 1} of ${count} with AI...`,
        });

        // Auto-advance to show current page being scanned
        dispatch({ type: 'SET_CURRENT_PAGE', index: i });

        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, pageNumber: pageNum }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          dispatch({
            type: 'SET_PAGE_EXTRACTION',
            index: i,
            extraction: result.data,
          });
        } else {
          const errorMsg = result.error || 'Scan failed';
          dispatch({ type: 'SET_PAGE_ERROR', index: i, error: errorMsg });
          // Stop on first error (likely a config/model issue that will repeat)
          toast.error(`Scanning stopped: ${errorMsg}`);
          break;
        }
      } catch (error) {
        console.error(`Failed to process page ${pageNum}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        dispatch({ type: 'SET_PAGE_ERROR', index: i, error: errorMsg });
        toast.error(`Scanning stopped: ${errorMsg}`);
        break;
      }
    }

    // Move to review step (even with partial results)
    dispatch({ type: 'SET_STEP', step: 'reviewing' });
    dispatch({ type: 'SET_CURRENT_PAGE', index: 0 });
  }, [state.startPage, state.endPage]);

  const handleApproveAndSave = async () => {
    if (!state.chapterName.trim()) {
      toast.error('Please enter a chapter name');
      return;
    }

    const successfulPages = state.pages.filter((p) => p.extraction !== null);
    if (successfulPages.length === 0) {
      toast.error('No pages were successfully scanned');
      return;
    }

    dispatch({ type: 'SET_SAVING', saving: true });

    try {
      // Aggregate content from all pages
      const stringify = (arr: unknown[]) => arr.map(toDisplayString).join('\n');

      const aggregatedContent = successfulPages
        .map((p) => {
          const ext = p.extraction!;
          let content = toDisplayString(ext.text_content);
          if (ext.visual_elements?.length > 0) {
            content += '\n\n[Visual Elements]\n' + stringify(ext.visual_elements);
          }
          if (ext.key_facts?.length > 0) {
            content += '\n\n[Key Facts]\n' + stringify(ext.key_facts);
          }
          if (ext.activities?.length > 0) {
            content += '\n\n[Activities]\n' + stringify(ext.activities);
          }
          if (ext.question_seeds?.length > 0) {
            content += '\n\n[Question Seeds]\n' + stringify(ext.question_seeds);
          }
          return content;
        })
        .join('\n\n---\n\n');

      // Use createChapter for now (createWithPages is available for future use)
      await createChapter({
        subjectId,
        name: state.chapterName.trim(),
        chapterNumber: state.chapterNumber,
        content: aggregatedContent,
        pageCount: successfulPages.length,
        sourceType: 'pdf',
        difficulty: null,
      });

      toast.success(
        `Chapter saved with ${successfulPages.length} pages of content`
      );
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to save chapter:', error);
      toast.error('Failed to save chapter');
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  };

  const maxPages = pdfLoaded ? pageCount : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`flex flex-col overflow-hidden ${
          state.step === 'reviewing' || state.step === 'scanning'
            ? 'sm:max-w-[900px] h-[90vh]'
            : 'sm:max-w-[500px] max-h-[90vh]'
        }`}
      >
        <DialogHeader>
          <DialogTitle>
            {state.step === 'select' && 'Upload Textbook'}
            {state.step === 'range' && 'Select Pages'}
            {state.step === 'scanning' && 'Scanning Pages'}
            {state.step === 'reviewing' && 'Review Extracted Content'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select PDF or use cached */}
        {state.step === 'select' && (
          <div className="space-y-4">
            {pdfLoaded && fileName && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  PDF already loaded: {fileName}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {pageCount} pages available
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={handleUseCachedPdf}
                >
                  Create another unit from this PDF
                </Button>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {pdfLoaded
                  ? 'Or upload a different textbook PDF'
                  : 'Upload a textbook PDF'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Max file size: 100MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfSelect}
              />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select PDF
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select page range and chapter info */}
        {state.step === 'range' && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium">{fileName}</span> — {pageCount} pages
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chapterName">Unit/Chapter Name</Label>
                <Input
                  id="chapterName"
                  value={state.chapterName}
                  onChange={(e) =>
                    dispatch({ type: 'SET_CHAPTER_NAME', name: e.target.value })
                  }
                  placeholder="e.g., Fractions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapterNumber">Number</Label>
                <Input
                  id="chapterNumber"
                  type="number"
                  min={1}
                  value={state.chapterNumber}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_CHAPTER_NUMBER',
                      num: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startPage">Start Page</Label>
                <Input
                  id="startPage"
                  type="number"
                  min={1}
                  max={maxPages}
                  value={state.startPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    dispatch({ type: 'SET_START_PAGE', page: Math.min(val, maxPages) });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endPage">End Page</Label>
                <Input
                  id="endPage"
                  type="number"
                  min={state.startPage}
                  max={maxPages}
                  value={state.endPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || state.startPage;
                    dispatch({
                      type: 'SET_END_PAGE',
                      page: Math.max(state.startPage, Math.min(val, maxPages)),
                    });
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              {state.endPage - state.startPage + 1} pages will be scanned with AI.
              Each page takes ~3-5 seconds.
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => dispatch({ type: 'SET_STEP', step: 'select' })}
              >
                Back
              </Button>
              <Button
                onClick={startScanning}
                disabled={
                  !state.chapterName.trim() ||
                  state.startPage > state.endPage ||
                  state.endPage > maxPages
                }
              >
                Start Scanning ({state.endPage - state.startPage + 1} pages)
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Scanning progress (auto-transitions to reviewing) */}
        {state.step === 'scanning' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {state.pages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                  <p className="mt-4 text-sm text-gray-600">{state.progressText}</p>
                  <Progress value={state.progress} className="w-64 mx-auto mt-4" />
                </div>
              </div>
            ) : (
              <PageReviewPanel
                pages={state.pages}
                currentPageIndex={state.currentPageIndex}
                onPageChange={(idx) =>
                  dispatch({ type: 'SET_CURRENT_PAGE', index: idx })
                }
                onExtractionEdit={(idx, ext) =>
                  dispatch({ type: 'EDIT_EXTRACTION', index: idx, extraction: ext })
                }
                onApproveAll={handleApproveAndSave}
                approving={state.saving}
              />
            )}
          </div>
        )}

        {/* Step 4: Review and approve */}
        {state.step === 'reviewing' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <PageReviewPanel
              pages={state.pages}
              currentPageIndex={state.currentPageIndex}
              onPageChange={(idx) =>
                dispatch({ type: 'SET_CURRENT_PAGE', index: idx })
              }
              onExtractionEdit={(idx, ext) =>
                dispatch({ type: 'EDIT_EXTRACTION', index: idx, extraction: ext })
              }
              onApproveAll={handleApproveAndSave}
              approving={state.saving}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
