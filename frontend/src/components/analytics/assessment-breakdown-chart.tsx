'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import type { AssessmentSummary } from '@/services/analytics-service';

interface AssessmentBreakdownChartProps {
  data: AssessmentSummary[];
  title?: string;
}

export function AssessmentBreakdownChart({
  data,
  title = 'Assessment Breakdown',
}: AssessmentBreakdownChartProps) {
  // Transform data for the chart
  const chartData = data.map((a) => ({
    name: a.assessmentName.length > 12 ? a.assessmentName.slice(0, 12) + '...' : a.assessmentName,
    fullName: a.assessmentName,
    average: a.average,
    highest: a.highest,
    lowest: a.lowest,
    passRate: a.passRate,
    type: a.type,
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No assessment data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
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
                formatter={(value, name) => [
                  `${value}%`,
                  String(name).charAt(0).toUpperCase() + String(name).slice(1),
                ]}
                labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="average" name="Average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="highest" name="Highest" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lowest" name="Lowest" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
