'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Eye,
  Pencil,
  Copy,
  Check,
  BookOpen,
  Image,
  Lightbulb,
  ClipboardList,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentViewerProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

interface ParsedSection {
  type: 'text' | 'visual_elements' | 'key_facts' | 'activities' | 'question_seeds';
  content: string;
  items?: string[];
}

/** Parse content that may contain [Section] markers from vision scanning */
function parseContent(raw: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const sectionPattern = /\[(?:Visual Elements|Key Facts|Activities|Question Seeds)\]/g;

  // Check if content has structured markers
  if (!sectionPattern.test(raw)) {
    // Plain content, no markers
    return [{ type: 'text', content: raw }];
  }

  // Split by page separators first
  const pages = raw.split(/\n\n---\n\n/);

  for (const page of pages) {
    const lines = page.split('\n');
    let currentType: ParsedSection['type'] = 'text';
    let currentLines: string[] = [];

    const flush = () => {
      const joined = currentLines.join('\n').trim();
      if (!joined) return;
      if (currentType === 'text') {
        sections.push({ type: 'text', content: joined });
      } else {
        const items = currentLines.map((l) => l.trim()).filter(Boolean);
        sections.push({ type: currentType, content: joined, items });
      }
      currentLines = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '[Visual Elements]') {
        flush();
        currentType = 'visual_elements';
      } else if (trimmed === '[Key Facts]') {
        flush();
        currentType = 'key_facts';
      } else if (trimmed === '[Activities]') {
        flush();
        currentType = 'activities';
      } else if (trimmed === '[Question Seeds]') {
        flush();
        currentType = 'question_seeds';
      } else {
        currentLines.push(line);
      }
    }
    flush();
    currentType = 'text';
  }

  return sections;
}

const sectionConfig = {
  visual_elements: {
    icon: Image,
    label: 'Illustrations & Diagrams',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    bullet: 'text-purple-400',
  },
  key_facts: {
    icon: Lightbulb,
    label: 'Key Facts',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    bullet: 'text-amber-400',
  },
  activities: {
    icon: ClipboardList,
    label: 'Activities & Exercises',
    bg: 'bg-green-50',
    text: 'text-green-900',
    bullet: 'text-green-500',
  },
  question_seeds: {
    icon: HelpCircle,
    label: 'Possible Questions',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    bullet: 'text-gray-400',
  },
};

export function ContentViewer({ content, onChange, readOnly = false }: ContentViewerProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Content copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy content');
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const sections = parseContent(content);
  const hasStructuredContent = sections.some((s) => s.type !== 'text');

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Content</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {wordCount.toLocaleString()} words • {charCount.toLocaleString()} chars
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
            {!readOnly && (
              <div className="flex border rounded-md">
                <Button
                  variant={mode === 'view' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none px-2"
                  onClick={() => setMode('view')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant={mode === 'edit' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none px-2"
                  onClick={() => setMode('edit')}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === 'view' || readOnly ? (
          <div className="max-h-[60vh] overflow-y-auto rounded-md bg-gray-50 p-4">
            {!content ? (
              <span className="text-gray-400 italic text-sm">No content available</span>
            ) : hasStructuredContent ? (
              <div className="space-y-4">
                {sections.map((section, idx) => (
                  <FormattedSection key={idx} section={section} />
                ))}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {content}
              </pre>
            )}
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[60vh] font-mono text-sm resize-none"
            placeholder="Enter chapter content..."
          />
        )}
      </CardContent>
    </Card>
  );
}

function FormattedSection({ section }: { section: ParsedSection }) {
  if (section.type === 'text') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <BookOpen className="h-4 w-4" />
          Content
        </div>
        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {section.content}
        </div>
      </div>
    );
  }

  const config = sectionConfig[section.type];
  const Icon = config.icon;
  const items = section.items || [];

  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <Icon className="h-4 w-4" />
        {config.label}
      </div>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li
            key={idx}
            className={`flex gap-2 p-2 ${config.bg} rounded-lg ${config.text} text-xs`}
          >
            <span className={`${config.bullet} flex-shrink-0 mt-0.5`}>
              {section.type === 'activities' ? `${idx + 1}.` :
               section.type === 'question_seeds' ? `Q${idx + 1}.` : '\u2022'}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
