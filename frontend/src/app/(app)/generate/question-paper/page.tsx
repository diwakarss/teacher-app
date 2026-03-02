'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Save, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { useClassStore } from '@/stores/class-store';
import { useGenerationStore } from '@/stores/generation-store';
import { QuestionPaperForm } from '@/components/generation/question-paper-form';
import { QuestionPaperPreview } from '@/components/generation/question-paper-preview';
import { PageLoadingSkeleton } from '@/components/ui/loading-skeleton';
import type { GenerateQuestionPaperParams } from '@/services/question-paper-service';

function GenerateQuestionPaperContent() {
  const router = useRouter();

  const { activeClassId } = useAppStore();
  const { classes, loadClasses } = useClassStore();
  const {
    pendingQuestionPaper,
    generating,
    loading,
    error,
    generateQuestionPaper,
    savePendingQuestionPaper,
    clearPending,
    clearError,
  } = useGenerationStore();

  const activeClass = classes.find((c) => c.id === activeClassId);

  useEffect(() => {
    loadClasses();
    return () => {
      clearPending();
      clearError();
    };
  }, [loadClasses, clearPending, clearError]);

  const handleGenerate = async (params: GenerateQuestionPaperParams) => {
    try {
      await generateQuestionPaper(params);
      toast.success('Question paper generated');
    } catch {
      toast.error('Failed to generate question paper');
    }
  };

  const handleSave = async () => {
    try {
      const saved = await savePendingQuestionPaper();
      toast.success('Question paper saved');
      router.push(`/generate/question-paper/${saved.id}`);
    } catch {
      toast.error('Failed to save question paper');
    }
  };

  const handleRegenerate = () => {
    clearPending();
  };

  if (!activeClassId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate Question Paper</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No class selected
            </h3>
            <p className="text-center text-sm text-gray-500">
              Select a class from the header dropdown to generate question papers
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/generate/lesson-plan">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Generate Question Paper
            </h1>
            {activeClass && (
              <p className="text-sm text-gray-500">{activeClass.name}</p>
            )}
          </div>
        </div>
        {pendingQuestionPaper && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Save Paper
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="flex items-center gap-3 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={pendingQuestionPaper ? 'lg:col-span-1' : 'lg:col-span-2'}>
          <QuestionPaperForm
            onGenerate={handleGenerate}
            generating={generating}
          />

          {!pendingQuestionPaper && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <FileText className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-foreground">
                      Want to generate a lesson plan instead?
                    </p>
                    <p>
                      Go to{' '}
                      <Link
                        href="/generate/lesson-plan"
                        className="text-primary hover:underline"
                      >
                        Lesson Plan Generator
                      </Link>{' '}
                      to create detailed lesson plans.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {pendingQuestionPaper && (
          <div className="lg:col-span-1">
            <QuestionPaperPreview paper={pendingQuestionPaper} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function GenerateQuestionPaperPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton message="Loading generator..." />}>
      <GenerateQuestionPaperContent />
    </Suspense>
  );
}
