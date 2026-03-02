'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { LessonPlanPreview } from '@/components/generation/lesson-plan-preview';
import type { LessonPlanOutput } from '@/lib/prompts/lesson-plan-prompt';
import { LessonPlanCardSkeleton } from '@/components/ui/loading-skeleton';

export default function LessonPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const {
    currentLessonPlan,
    loading,
    error,
    loadLessonPlanById,
    updateLessonPlan,
    deleteLessonPlan,
    clearError,
  } = useGenerationStore();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadLessonPlanById(id);
    return () => clearError();
  }, [id, loadLessonPlanById, clearError]);

  const handleSave = async (plan: LessonPlanOutput) => {
    try {
      await updateLessonPlan(id, {
        name: plan.name,
        objectives: JSON.stringify(plan.objectives),
        sections: JSON.stringify(plan.sections),
        materials: plan.materials ? JSON.stringify(plan.materials) : null,
      });
      toast.success('Lesson plan updated');
    } catch {
      toast.error('Failed to update lesson plan');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteLessonPlan(id);
      toast.success('Lesson plan deleted');
      router.push('/content');
    } catch {
      toast.error('Failed to delete lesson plan');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleExport = () => {
    if (!currentLessonPlan) return;

    const plan = currentLessonPlan;
    const content = `
# ${plan.name}

## Learning Objectives
${plan.parsedObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

## Introduction (${plan.parsedSections.introduction.duration} minutes)
${plan.parsedSections.introduction.content}

**Hook:** ${plan.parsedSections.introduction.hook}

## Main Content (${plan.parsedSections.mainContent.duration} minutes)

### Topics
${plan.parsedSections.mainContent.topics.map((t) => `- ${t}`).join('\n')}

### Teaching Strategies
${plan.parsedSections.mainContent.teachingStrategies.map((s) => `- ${s}`).join('\n')}

## Activities (${plan.parsedSections.activities.duration} minutes)
${plan.parsedSections.activities.activities
  .map(
    (a) => `
### ${a.name}
${a.description}
${a.materials?.length ? `Materials: ${a.materials.join(', ')}` : ''}
`
  )
  .join('\n')}

## Assessment (${plan.parsedSections.assessment.duration} minutes)

### Methods
${plan.parsedSections.assessment.methods.map((m) => `- ${m}`).join('\n')}

### Questions
${plan.parsedSections.assessment.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Differentiation

### For Advanced Students
${plan.parsedSections.differentiation.advanced.map((a) => `- ${a}`).join('\n')}

### For Struggling Students
${plan.parsedSections.differentiation.struggling.map((s) => `- ${s}`).join('\n')}

## Materials Needed
${plan.parsedMaterials.map((m) => `- ${m}`).join('\n')}
`.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.name.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Lesson plan exported');
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lesson Plan</h1>
          </div>
        </div>
        <LessonPlanCardSkeleton />
      </div>
    );
  }

  if (error || !currentLessonPlan) {
    return (
      <div className="p-4">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lesson Plan</h1>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              {error || 'Lesson plan not found'}
            </h3>
            <p className="text-center text-sm text-gray-500">
              The lesson plan may have been deleted or does not exist.
            </p>
            <Link href="/content" className="mt-4">
              <Button variant="outline">Back to Content</Button>
            </Link>
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
            <h1 className="text-2xl font-bold text-gray-900">Lesson Plan</h1>
            <p className="text-sm text-gray-500">
              Created{' '}
              {new Date(currentLessonPlan.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <LessonPlanPreview
        plan={currentLessonPlan}
        editable
        onSave={handleSave}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{currentLessonPlan.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
