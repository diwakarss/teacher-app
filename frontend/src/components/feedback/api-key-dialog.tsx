'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFeedbackStore } from '@/stores/feedback-store';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const { useAI, setUseAI } = useFeedbackStore();

  const handleSave = () => {
    toast.success(useAI ? 'AI feedback enabled' : 'Using template feedback');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Feedback Settings
          </DialogTitle>
          <DialogDescription>
            Enable AI-powered feedback generation for more personalized messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-ai">Use AI Feedback</Label>
              <p className="text-sm text-gray-500">
                Generate personalized feedback with AI
              </p>
            </div>
            <Switch
              id="use-ai"
              checked={useAI}
              onCheckedChange={setUseAI}
            />
          </div>

          {!useAI && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium">Template Mode</p>
              <p className="mt-1">
                Feedback will be generated using predefined templates based on student performance.
                Enable AI mode for more personalized messages.
              </p>
            </div>
          )}

          {useAI && (
            <div className="rounded-lg bg-purple-50 p-4 text-sm text-purple-700">
              <p className="font-medium">AI Mode</p>
              <p className="mt-1">
                Personalized feedback will be generated using AWS Bedrock.
                Each message is tailored to the student&apos;s performance.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
