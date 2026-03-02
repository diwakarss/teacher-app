'use client';

import { Progress } from '@/components/ui/progress';
import { FileText, Camera, Loader2 } from 'lucide-react';

interface ProcessingProgressProps {
  type: 'pdf' | 'image';
  progress: number;
  statusText: string;
}

export function ProcessingProgress({ type, progress, statusText }: ProcessingProgressProps) {
  const Icon = type === 'pdf' ? FileText : Camera;

  return (
    <div className="py-8 space-y-4">
      <div className="text-center">
        <div className="relative inline-block">
          <Icon className="mx-auto h-12 w-12 text-primary" />
          <Loader2 className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-spin" />
        </div>
        <p className="mt-4 text-sm text-gray-600">{statusText}</p>
      </div>
      <Progress value={progress} className="w-full" />
      <p className="text-center text-xs text-gray-400">{progress}% complete</p>
    </div>
  );
}
