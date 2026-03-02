import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feedback Generation</h1>
        <p className="text-sm text-gray-500">Generate personalized feedback for students</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No feedback to generate</h3>
          <p className="mb-4 text-center text-sm text-gray-500">
            Enter marks for students first to generate feedback
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
