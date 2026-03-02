import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ClipboardList, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/classes"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
        >
          <BookOpen className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-gray-700">Manage Classes</span>
        </Link>

        <Link
          href="/students"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
        >
          <Users className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-gray-700">View Students</span>
        </Link>

        <Link
          href="/marks"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
        >
          <ClipboardList className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-gray-700">Enter Marks</span>
        </Link>

        <Link
          href="/feedback"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
        >
          <MessageSquare className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-gray-700">Generate Feedback</span>
        </Link>
      </div>
    </div>
  );
}
