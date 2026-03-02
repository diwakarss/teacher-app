'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  FileQuestion,
  Clock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useClassStore } from '@/stores/class-store';
import { useGenerationStore } from '@/stores/generation-store';
import { lessonPlanService } from '@/services/lesson-plan-service';
import { questionPaperService } from '@/services/question-paper-service';
import { initializeDb } from '@/lib/db/database';

export default function GeneratePage() {
  const { activeClassId } = useAppStore();
  const { classes, loadClasses } = useClassStore();
  const { lessonPlans, questionPapers, loadLessonPlans, loadQuestionPapers } =
    useGenerationStore();

  const [lessonPlanCount, setLessonPlanCount] = useState(0);
  const [questionPaperCount, setQuestionPaperCount] = useState(0);

  const activeClass = classes.find((c) => c.id === activeClassId);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    async function loadCounts() {
      await initializeDb();
      const [lpCount, qpCount] = await Promise.all([
        lessonPlanService.getCount(),
        questionPaperService.getCount(),
      ]);
      setLessonPlanCount(lpCount);
      setQuestionPaperCount(qpCount);
    }
    loadCounts();
  }, []);

  if (!activeClassId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No class selected
            </h3>
            <p className="text-center text-sm text-gray-500">
              Select a class from the header dropdown to generate content
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate</h1>
        {activeClass && (
          <p className="text-sm text-gray-500">{activeClass.name}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Lesson Plan Generator */}
        <Link href="/generate/lesson-plan">
          <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                Lesson Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Generate structured lesson plans with objectives, activities, and assessments from your chapter content.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {lessonPlanCount} saved
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Question Paper Generator */}
        <Link href="/generate/question-paper">
          <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <FileQuestion className="h-5 w-5 text-purple-600" />
                </div>
                Question Paper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Generate complete question papers with sections, marks distribution, and answer keys.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {questionPaperCount} saved
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Items */}
      {(lessonPlanCount > 0 || questionPaperCount > 0) && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Quick Access</h2>
          <div className="space-y-2">
            {lessonPlanCount > 0 && (
              <Link href="/generate/lesson-plan">
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        View Saved Lesson Plans
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {lessonPlanCount} plans
                    </span>
                  </CardContent>
                </Card>
              </Link>
            )}
            {questionPaperCount > 0 && (
              <Link href="/generate/question-paper">
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <FileQuestion className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">
                        View Saved Question Papers
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {questionPaperCount} papers
                    </span>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
