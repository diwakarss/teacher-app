import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MarksPage() {
  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          New Assessment
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No assessments yet</h3>
          <p className="mb-4 text-center text-sm text-gray-500">
            Create a class and add students first
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
