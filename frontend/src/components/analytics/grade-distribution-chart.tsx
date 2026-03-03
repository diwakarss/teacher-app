'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { GradeCount } from '@/services/analytics-service';

interface GradeDistributionChartProps {
  data: GradeCount[];
  title?: string;
}

export function GradeDistributionChart({
  data,
  title = 'Grade Distribution',
}: GradeDistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No grade data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChartIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                nameKey="grade"
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => {
                  const numValue = Number(value) || 0;
                  return [
                    `${numValue} students (${((numValue / total) * 100).toFixed(1)}%)`,
                    `Grade ${name}`,
                  ];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => `Grade ${value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Total: {total} grades recorded
        </div>
      </CardContent>
    </Card>
  );
}
