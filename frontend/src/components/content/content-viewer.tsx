'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Pencil, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ContentViewerProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

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
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 p-4 rounded-md max-h-[60vh] overflow-y-auto">
              {content || (
                <span className="text-gray-400 italic">No content available</span>
              )}
            </pre>
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
