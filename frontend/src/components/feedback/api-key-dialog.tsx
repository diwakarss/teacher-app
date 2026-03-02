'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFeedbackStore } from '@/stores/feedback-store';
import { toast } from 'sonner';
import { Key, Sparkles } from 'lucide-react';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const { apiKey, useAI, setApiKey, setUseAI } = useFeedbackStore();
  const [key, setKey] = useState(apiKey || '');

  const handleSave = () => {
    if (useAI && !key.trim()) {
      toast.error('Please enter an API key or disable AI feedback');
      return;
    }

    setApiKey(key.trim() || null);
    toast.success(useAI ? 'AI feedback enabled' : 'Using template feedback');
    onOpenChange(false);
  };

  const handleToggleAI = (checked: boolean) => {
    setUseAI(checked);
    if (!checked) {
      setKey('');
      setApiKey(null);
    }
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
            Enable AI-powered feedback generation using Claude API for more personalized messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-ai">Use AI Feedback</Label>
              <p className="text-sm text-gray-500">
                Generate personalized feedback with Claude
              </p>
            </div>
            <Switch
              id="use-ai"
              checked={useAI}
              onCheckedChange={handleToggleAI}
            />
          </div>

          {useAI && (
            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Claude API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-ant-..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Your API key is stored locally and never sent to our servers.
                Get one at{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          )}

          {!useAI && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium">Template Mode</p>
              <p className="mt-1">
                Feedback will be generated using predefined templates based on student performance.
                Enable AI mode for more personalized messages.
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
