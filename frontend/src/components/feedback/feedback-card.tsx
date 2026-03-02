'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Trash2, MessageSquare } from 'lucide-react';
import { useFeedbackStore, type Feedback } from '@/stores/feedback-store';
import { getPerformanceLevelColor, type PerformanceLevel } from '@/services/feedback-service';
import { toast } from 'sonner';

interface FeedbackCardProps {
  feedback: Feedback;
  studentName: string;
  rollNumber: string;
}

export function FeedbackCard({ feedback, studentName, rollNumber }: FeedbackCardProps) {
  const { deleteFeedback } = useFeedbackStore();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedback.message);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyForWhatsApp = async () => {
    try {
      // Format for WhatsApp (add some formatting)
      const formatted = feedback.message;
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      toast.success('Copied for WhatsApp');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFeedback(feedback.id);
      toast.success('Feedback deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const performanceLevel = feedback.performanceLevel as PerformanceLevel;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {rollNumber}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{studentName}</h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={getPerformanceLevelColor(performanceLevel)}
                >
                  {performanceLevel}
                </Badge>
                <span className="text-xs text-gray-400">
                  {feedback.tone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              title="Copy"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700"
              onClick={handleCopyForWhatsApp}
              title="Copy for WhatsApp"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">{feedback.message}</p>

        <p className="mt-2 text-xs text-gray-400">
          Generated {new Date(feedback.createdAt).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
