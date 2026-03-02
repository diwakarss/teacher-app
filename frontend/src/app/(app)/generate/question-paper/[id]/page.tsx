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
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { QuestionPaperPreview } from '@/components/generation/question-paper-preview';
import { LessonPlanCardSkeleton } from '@/components/ui/loading-skeleton';
import { exportQuestionPaperPdf } from '@/lib/pdf-export';

export default function QuestionPaperDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const {
    currentQuestionPaper,
    loading,
    error,
    loadQuestionPaperById,
    deleteQuestionPaper,
    clearError,
  } = useGenerationStore();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadQuestionPaperById(id);
    return () => clearError();
  }, [id, loadQuestionPaperById, clearError]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteQuestionPaper(id);
      toast.success('Question paper deleted');
      router.push('/generate/question-paper');
    } catch {
      toast.error('Failed to delete question paper');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleExportPdf = () => {
    if (!currentQuestionPaper) return;

    exportQuestionPaperPdf(
      {
        name: currentQuestionPaper.name,
        totalMarks: currentQuestionPaper.totalMarks,
        duration: currentQuestionPaper.duration,
        sections: currentQuestionPaper.parsedSections,
      },
      false
    );
    toast.success('Opening print dialog for PDF export');
  };

  const handleExportPdfWithAnswers = () => {
    if (!currentQuestionPaper) return;

    exportQuestionPaperPdf(
      {
        name: currentQuestionPaper.name,
        totalMarks: currentQuestionPaper.totalMarks,
        duration: currentQuestionPaper.duration,
        sections: currentQuestionPaper.parsedSections,
      },
      true,
      currentQuestionPaper.parsedAnswerKey
    );
    toast.success('Opening print dialog for PDF with answers');
  };

  const handleExportMarkdown = () => {
    if (!currentQuestionPaper) return;

    const paper = currentQuestionPaper;
    const sectionPrefixes = ['A', 'B', 'C', 'D', 'E'];

    let content = `# ${paper.name}\n\n`;
    content += `**Total Marks:** ${paper.totalMarks}  \n`;
    content += `**Duration:** ${paper.duration} minutes  \n`;
    content += `**Difficulty:** ${paper.difficulty}  \n\n`;
    content += `---\n\n`;

    paper.parsedSections.forEach((section, sIdx) => {
      content += `## ${section.name}\n\n`;
      content += `*${section.instructions}*\n\n`;
      content += `**Total: ${section.totalMarks} marks**\n\n`;

      section.questions.forEach((q) => {
        const prefix = sectionPrefixes[sIdx] || `S${sIdx + 1}`;
        content += `**${prefix}${q.number}.** ${q.text} *(${q.marks} ${q.marks === 1 ? 'mark' : 'marks'})*\n`;

        if (q.options && q.options.length > 0) {
          q.options.forEach((opt) => {
            content += `   ${opt}\n`;
          });
        }
        content += '\n';
      });

      content += '---\n\n';
    });

    content += `## Answer Key\n\n`;
    paper.parsedAnswerKey.forEach((item) => {
      content += `**${item.questionNumber}:** ${item.answer}\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paper.name.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Markdown file downloaded');
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/generate/question-paper">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Paper</h1>
          </div>
        </div>
        <LessonPlanCardSkeleton />
      </div>
    );
  }

  if (error || !currentQuestionPaper) {
    return (
      <div className="p-4">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/generate/question-paper">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Paper</h1>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              {error || 'Question paper not found'}
            </h3>
            <p className="text-center text-sm text-gray-500">
              The question paper may have been deleted or does not exist.
            </p>
            <Link href="/generate/question-paper" className="mt-4">
              <Button variant="outline">Back to Generator</Button>
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
          <Link href="/generate/question-paper">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Paper</h1>
            <p className="text-sm text-gray-500">
              Created{' '}
              {new Date(currentQuestionPaper.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportPdfWithAnswers}>
            <Download className="mr-2 h-4 w-4" />
            PDF + Answers
          </Button>
          <Button variant="outline" onClick={handleExportMarkdown}>
            <FileText className="mr-2 h-4 w-4" />
            Markdown
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

      <QuestionPaperPreview paper={currentQuestionPaper} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question Paper</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{currentQuestionPaper.name}
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
