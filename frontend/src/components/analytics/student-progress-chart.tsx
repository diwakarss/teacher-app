'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { StudentProgressSummary } from '@/services/analytics-service';

interface StudentProgressChartProps {
  data: StudentProgressSummary[];
  title?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function StudentProgressChart({
  data,
  title = 'Student Progress',
}: StudentProgressChartProps) {
  // Transform data for recharts - create unified x-axis from all assessments
  const allAssessments = new Map<string, { date: string; name: string }>();
  data.forEach((student) => {
    student.dataPoints.forEach((dp) => {
      if (!allAssessments.has(dp.assessmentName)) {
        allAssessments.set(dp.assessmentName, { date: dp.date, name: dp.assessmentName });
      }
    });
  });

  // Sort assessments by date
  const sortedAssessments = Array.from(allAssessments.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Build chart data with student percentages
  const chartData = sortedAssessments.map((assessment) => {
    const point: Record<string, string | number | undefined> = {
      name: assessment.name,
      date: new Date(assessment.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      }),
    };

    data.forEach((student) => {
      const dp = student.dataPoints.find((d) => d.assessmentName === assessment.name);
      point[student.studentName] = dp?.percentage;
    });

    return point;
  });

  if (data.length === 0 || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No progress data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value}%`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {data.map((student, index) => (
                <Line
                  key={student.studentId}
                  type="monotone"
                  dataKey={student.studentName}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
