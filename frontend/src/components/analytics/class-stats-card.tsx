'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Award, AlertTriangle } from 'lucide-react';
import type { ClassStatistics } from '@/services/analytics-service';

interface ClassStatsCardProps {
  stats: ClassStatistics | null;
  loading?: boolean;
}

export function ClassStatsCard({ stats, loading }: ClassStatsCardProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assessments</p>
              <p className="text-2xl font-bold">{stats.totalAssessments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class Average</p>
              <p className="text-2xl font-bold">{stats.overallAverage}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <p className="text-2xl font-bold">{stats.passRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top performers and needs attention */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.topPerformers.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-green-500" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {stats.topPerformers.map((student, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{student.name}</span>
                    <span className="text-green-600">{student.average}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {stats.needsAttention.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {stats.needsAttention.map((student, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{student.name}</span>
                    <span className="text-amber-600">{student.average}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
