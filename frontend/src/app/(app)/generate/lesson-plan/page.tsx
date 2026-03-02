'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Save, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { useClassStore } from '@/stores/class-store';
import { useGenerationStore } from '@/stores/generation-store';
import { LessonPlanForm } from '@/components/generation/lesson-plan-form';
import { LessonPlanPreview } from '@/components/generation/lesson-plan-preview';
import { PageLoadingSkeleton } from '@/components/ui/loading-skeleton';
import type { GenerateLessonPlanParams } from '@/services/lesson-plan-service';

function GenerateLessonPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChapterId = searchParams.get('chapter') || undefined;

  const { activeClassId } = useAppStore();
  const { classes, loadClasses } = useClassStore();
  const {
    pendingLessonPlan,
    generating,
    loading,
    error,
    generateLessonPlan,
    savePendingLessonPlan,
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

  const handleGenerate = async (params: GenerateLessonPlanParams) => {
    try {
      await generateLessonPlan(params);
      toast.success('Lesson plan generated');
    } catch {
      toast.error('Failed to generate lesson plan');
    }
  };

  const handleSave = async () => {
    try {
      const saved = await savePendingLessonPlan();
      toast.success('Lesson plan saved');
      router.push(`/generate/lesson-plan/${saved.id}`);
    } catch {
      toast.error('Failed to save lesson plan');
    }
  };

  const handleRegenerate = () => {
    clearPending();
  };

  if (!activeClassId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate Lesson Plan</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No class selected
            </h3>
            <p className="text-center text-sm text-gray-500">
              Select a class from the header dropdown to generate lesson plans
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
          <Link href="/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Generate Lesson Plan
            </h1>
            {activeClass && (
              <p className="text-sm text-gray-500">{activeClass.name}</p>
            )}
          </div>
        </div>
        {pendingLessonPlan && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Save Plan
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
        <div className={pendingLessonPlan ? 'lg:col-span-1' : 'lg:col-span-2'}>
          <LessonPlanForm
            onGenerate={handleGenerate}
            generating={generating}
            initialChapterId={initialChapterId}
          />

          {!pendingLessonPlan && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <FileText className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-foreground">
                      Need to view saved plans?
                    </p>
                    <p>
                      Access your saved lesson plans from the{' '}
                      <Link
                        href="/content"
                        className="text-primary hover:underline"
                      >
                        Content
                      </Link>{' '}
                      section.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {pendingLessonPlan && (
          <div className="lg:col-span-1">
            <LessonPlanPreview plan={pendingLessonPlan} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function GenerateLessonPlanPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton message="Loading generator..." />}>
      <GenerateLessonPlanContent />
    </Suspense>
  );
}
