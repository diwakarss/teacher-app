'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Pencil,
  Eye,
  BookOpen,
  Lightbulb,
  ClipboardList,
  HelpCircle,
  Image,
} from 'lucide-react';

export interface PageExtraction {
  summary: string;
  text_content: string;
  visual_elements: string[];
  key_facts: string[];
  activities: string[];
  question_seeds: string[];
}

interface PageData {
  pageNumber: number;
  imageDataUrl: string | null;
  extraction: PageExtraction | null;
  scanning: boolean;
  error: string | null;
}

interface PageReviewPanelProps {
  pages: PageData[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  onExtractionEdit: (index: number, extraction: PageExtraction) => void;
  onApproveAll: () => void;
  approving: boolean;
}

export function PageReviewPanel({
  pages,
  currentPageIndex,
  onPageChange,
  onExtractionEdit,
  onApproveAll,
  approving,
}: PageReviewPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const currentPage = pages[currentPageIndex];
  const allScanned = pages.every((p) => p.extraction !== null && !p.scanning);
  const hasErrors = pages.some((p) => p.error !== null);
  const scannedCount = pages.filter((p) => p.extraction !== null).length;

  if (!currentPage) return null;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Navigation header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPageIndex === 0}
          onClick={() => onPageChange(currentPageIndex - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Page {currentPageIndex + 1} of {pages.length}
            {currentPage.scanning && (
              <span className="ml-2 text-blue-600">
                <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                Scanning...
              </span>
            )}
          </span>
          {currentPage.extraction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="text-xs"
            >
              {editMode ? (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </>
              )}
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPageIndex === pages.length - 1}
          onClick={() => onPageChange(currentPageIndex + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Side-by-side content: image left, extraction right */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Page image */}
        <div className="min-h-0 overflow-y-auto border rounded-lg bg-gray-50 p-2">
          {currentPage.imageDataUrl ? (
            <img
              src={currentPage.imageDataUrl}
              alt={`Page ${currentPage.pageNumber}`}
              className="w-full h-auto"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading page image...
            </div>
          )}
        </div>

        {/* Right: Extraction content */}
        <div className="min-h-0 overflow-y-auto pr-1">
          {currentPage.scanning && !currentPage.extraction && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Scanning page with AI...
            </div>
          )}

          {currentPage.error && !currentPage.extraction && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {currentPage.error}
            </div>
          )}

          {currentPage.extraction && !editMode && (
            <FormattedView extraction={currentPage.extraction} />
          )}

          {currentPage.extraction && editMode && (
            <EditView
              extraction={currentPage.extraction}
              onChange={(updated) => onExtractionEdit(currentPageIndex, updated)}
            />
          )}
        </div>
      </div>

      {/* Page dots / progress indicator */}
      <div className="flex-shrink-0 flex items-center gap-1 justify-center overflow-x-auto py-1">
        {pages.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onPageChange(idx)}
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
              idx === currentPageIndex
                ? 'bg-blue-600'
                : p.extraction
                  ? 'bg-green-400'
                  : p.error
                    ? 'bg-red-400'
                    : p.scanning
                      ? 'bg-blue-300 animate-pulse'
                      : 'bg-gray-300'
            }`}
            title={`Page ${idx + 1}${p.extraction ? ' (scanned)' : p.error ? ' (error)' : p.scanning ? ' (scanning)' : ''}`}
          />
        ))}
      </div>

      {/* Approve button */}
      <div className="flex-shrink-0">
        <Button
          onClick={onApproveAll}
          disabled={scannedCount === 0 || approving}
          className="w-full"
        >
          {approving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {allScanned
                ? `Approve & Save (${scannedCount} pages)`
                : scannedCount > 0
                  ? `Save ${scannedCount} scanned pages`
                  : hasErrors
                    ? 'No pages scanned successfully'
                    : 'Scanning in progress...'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/** Safely convert any value to a displayable string */
export function toDisplayString(item: unknown): string {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    // Handle objects like { type: "bar chart", description: "..." }
    const obj = item as Record<string, unknown>;
    if (obj.description) return String(obj.description);
    if (obj.text) return String(obj.text);
    if (obj.name) return String(obj.name);
    // Last resort: join all values
    return Object.values(obj).map(String).join(' — ');
  }
  return String(item);
}

/** Normalize an array that might contain objects into string[] */
function normalizeArray(arr: unknown[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(toDisplayString);
}

/** Formatted reading view - what the teacher sees by default */
function FormattedView({ extraction }: { extraction: PageExtraction }) {
  const summary = toDisplayString(extraction.summary);
  const textContent = toDisplayString(extraction.text_content);
  const visuals = normalizeArray(extraction.visual_elements);
  const facts = normalizeArray(extraction.key_facts);
  const activities = normalizeArray(extraction.activities);
  const questions = normalizeArray(extraction.question_seeds);

  return (
    <div className="space-y-4 text-sm">
      {/* Summary as a highlighted callout */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
        <p className="text-blue-900 font-medium">{summary}</p>
      </div>

      {/* Main text content */}
      {textContent && (
        <div className="space-y-1">
          <SectionHeader icon={<BookOpen className="h-4 w-4" />} label="Content" />
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap pl-1">
            {textContent}
          </div>
        </div>
      )}

      {/* Visual elements */}
      {visuals.length > 0 && (
        <div className="space-y-1.5">
          <SectionHeader icon={<Image className="h-4 w-4" />} label="Illustrations & Diagrams" />
          <div className="space-y-1.5 pl-1">
            {visuals.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-2 p-2 bg-purple-50 rounded-lg text-purple-900 text-xs"
              >
                <span className="text-purple-400 flex-shrink-0 mt-0.5">&#9679;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key facts */}
      {facts.length > 0 && (
        <div className="space-y-1.5">
          <SectionHeader icon={<Lightbulb className="h-4 w-4" />} label="Key Facts" />
          <ul className="space-y-1 pl-1">
            {facts.map((item, idx) => (
              <li
                key={idx}
                className="flex gap-2 p-2 bg-amber-50 rounded-lg text-amber-900 text-xs"
              >
                <span className="text-amber-400 flex-shrink-0 mt-0.5">&#9733;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        <div className="space-y-1.5">
          <SectionHeader icon={<ClipboardList className="h-4 w-4" />} label="Activities & Exercises" />
          <ol className="space-y-1 pl-1">
            {activities.map((item, idx) => (
              <li
                key={idx}
                className="flex gap-2 p-2 bg-green-50 rounded-lg text-green-900 text-xs"
              >
                <span className="text-green-500 font-semibold flex-shrink-0 mt-0.5 w-4 text-center">
                  {idx + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Question seeds */}
      {questions.length > 0 && (
        <div className="space-y-1.5">
          <SectionHeader icon={<HelpCircle className="h-4 w-4" />} label="Possible Questions" />
          <ul className="space-y-1 pl-1">
            {questions.map((item, idx) => (
              <li
                key={idx}
                className="flex gap-2 p-2 bg-gray-50 rounded-lg text-gray-700 text-xs"
              >
                <span className="text-gray-400 flex-shrink-0 mt-0.5">Q{idx + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {icon}
      {label}
    </div>
  );
}

/** Edit view - for making corrections */
function EditView({
  extraction,
  onChange,
}: {
  extraction: PageExtraction;
  onChange: (updated: PageExtraction) => void;
}) {
  const visuals = normalizeArray(extraction.visual_elements);
  const facts = normalizeArray(extraction.key_facts);
  const acts = normalizeArray(extraction.activities);
  const seeds = normalizeArray(extraction.question_seeds);

  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">Summary</label>
        <Input
          value={toDisplayString(extraction.summary)}
          onChange={(e) => onChange({ ...extraction, summary: e.target.value })}
          className="text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">Text Content</label>
        <Textarea
          value={toDisplayString(extraction.text_content)}
          onChange={(e) =>
            onChange({ ...extraction, text_content: e.target.value })
          }
          className="text-sm min-h-[200px] resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">
          Visual Elements (one per line)
        </label>
        <Textarea
          value={visuals.join('\n')}
          onChange={(e) =>
            onChange({
              ...extraction,
              visual_elements: e.target.value.split('\n').filter((l) => l.trim()),
            })
          }
          className="text-sm min-h-[80px] resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">
          Key Facts (one per line)
        </label>
        <Textarea
          value={facts.join('\n')}
          onChange={(e) =>
            onChange({
              ...extraction,
              key_facts: e.target.value.split('\n').filter((l) => l.trim()),
            })
          }
          className="text-sm min-h-[80px] resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">
          Activities (one per line)
        </label>
        <Textarea
          value={acts.join('\n')}
          onChange={(e) =>
            onChange({
              ...extraction,
              activities: e.target.value.split('\n').filter((l) => l.trim()),
            })
          }
          className="text-sm min-h-[80px] resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">
          Question Seeds (one per line)
        </label>
        <Textarea
          value={seeds.join('\n')}
          onChange={(e) =>
            onChange({
              ...extraction,
              question_seeds: e.target.value.split('\n').filter((l) => l.trim()),
            })
          }
          className="text-sm min-h-[80px] resize-y"
        />
      </div>
    </div>
  );
}
