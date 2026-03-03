'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, BookOpen, ClipboardList, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useClassStore } from '@/stores/class-store';
import { initializeDb } from '@/lib/db/database';
import { subjectService } from '@/services/subject-service';
import { analyticsService } from '@/services/analytics-service';
import { ClassStatsCard } from '@/components/analytics/class-stats-card';
import { StudentProgressChart } from '@/components/analytics/student-progress-chart';
import { AssessmentBreakdownChart } from '@/components/analytics/assessment-breakdown-chart';
import { GradeDistributionChart } from '@/components/analytics/grade-distribution-chart';
import type { Subject } from '@/lib/db/schema';
import type {
  ClassStatistics,
  StudentProgressSummary,
  AssessmentSummary,
  GradeCount,
} from '@/services/analytics-service';

export default function DashboardPage() {
  const { activeClassId } = useAppStore();
  const { classes, loadClasses } = useClassStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  const [stats, setStats] = useState<ClassStatistics | null>(null);
  const [progress, setProgress] = useState<StudentProgressSummary[]>([]);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [grades, setGrades] = useState<GradeCount[]>([]);
  const [loading, setLoading] = useState(true);

  const activeClass = classes.find((c) => c.id === activeClassId);

  useEffect(() => {
    initializeDb().then(() => loadClasses());
  }, [loadClasses]);

  useEffect(() => {
    async function loadSubjects() {
      if (activeClassId) {
        const subs = await subjectService.getByClassId(activeClassId);
        setSubjects(subs);
      } else {
        setSubjects([]);
      }
    }
    loadSubjects();
  }, [activeClassId]);

  useEffect(() => {
    async function loadAnalytics() {
      if (!activeClassId) {
        setStats(null);
        setProgress([]);
        setAssessments([]);
        setGrades([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const subjectFilter = selectedSubjectId === 'all' ? undefined : selectedSubjectId;

        const [statsData, progressData, assessmentData, gradeData] = await Promise.all([
          analyticsService.getClassStats(activeClassId),
          analyticsService.getClassStudentsProgress(activeClassId, {
            subjectId: subjectFilter,
            limit: 5,
          }),
          analyticsService.getAssessmentBreakdown(activeClassId, {
            subjectId: subjectFilter,
          }),
          analyticsService.getGradeDistribution(activeClassId, subjectFilter),
        ]);

        setStats(statsData);
        setProgress(progressData);
        setAssessments(assessmentData);
        setGrades(gradeData);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [activeClassId, selectedSubjectId]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {activeClass && <p className="text-sm text-muted-foreground">{activeClass.name}</p>}
        </div>
        {subjects.length > 0 && (
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!activeClassId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No class selected</h3>
            <p className="text-center text-sm text-muted-foreground">
              Select a class from the header to view analytics
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Class Statistics */}
          <ClassStatsCard stats={stats} loading={loading} />

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <StudentProgressChart data={progress} title="Student Progress" />
            <GradeDistributionChart data={grades} title="Grade Distribution" />
          </div>

          <AssessmentBreakdownChart data={assessments} title="Assessment Performance" />
        </>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/classes"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-gray-700">Classes</span>
          </Link>

          <Link
            href="/students"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <Users className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-gray-700">Students</span>
          </Link>

          <Link
            href="/marks"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <ClipboardList className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-gray-700">Marks</span>
          </Link>

          <Link
            href="/generate"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-gray-700">Generate</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
