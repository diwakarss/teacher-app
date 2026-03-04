'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Plus, X, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useClassStore } from '@/stores/class-store';
import { useContentStore } from '@/stores/content-store';
import { subjectService } from '@/services/subject-service';
import type { Subject } from '@/lib/db/schema';
import type { GenerateLessonPlanParams } from '@/services/lesson-plan-service';

interface LessonPlanFormProps {
  onGenerate: (params: GenerateLessonPlanParams) => Promise<void>;
  generating: boolean;
  initialChapterId?: string;
}

export function LessonPlanForm({
  onGenerate,
  generating,
  initialChapterId,
}: LessonPlanFormProps) {
  const isOnline = useOnlineStatus();
  const { activeClassId } = useAppStore();
  const { classes, loadClasses } = useClassStore();
  const { chapters, loadChapters } = useContentStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    initialChapterId || ''
  );
  const [duration, setDuration] = useState<string>('45');
  const [customObjectives, setCustomObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState('');

  const activeClass = classes.find((c) => c.id === activeClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const loadSubjectsForClass = useCallback(async (classId: string | null) => {
    if (!classId) return;
    const subs = await subjectService.getByClassId(classId);
    setSubjects(subs);
    setSelectedSubjectId((prev) => (subs.length > 0 && !prev ? subs[0].id : prev));
  }, []);

  useEffect(() => {
    loadSubjectsForClass(activeClassId);
  }, [activeClassId, loadSubjectsForClass]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadChapters(selectedSubjectId);
    }
  }, [selectedSubjectId, loadChapters]);

  useEffect(() => {
    if (initialChapterId && chapters.length > 0) {
      const chapter = chapters.find((c) => c.id === initialChapterId);
      if (chapter) {
        setSelectedChapterId(initialChapterId);
      }
    }
  }, [initialChapterId, chapters]);

  const addObjective = () => {
    if (newObjective.trim()) {
      setCustomObjectives([...customObjectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setCustomObjectives(customObjectives.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      toast.error('Generation requires an internet connection');
      return;
    }

    if (!selectedChapter || !selectedSubject) return;

    const params: GenerateLessonPlanParams = {
      chapterId: selectedChapter.id,
      subjectId: selectedSubject.id,
      chapterName: selectedChapter.name,
      chapterContent: selectedChapter.content,
      subjectName: selectedSubject.name,
      duration: parseInt(duration) || 45,
      customObjectives:
        customObjectives.length > 0 ? customObjectives : undefined,
    };

    await onGenerate(params);
  };

  const isValid =
    selectedSubjectId && selectedChapterId && duration && parseInt(duration) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Lesson Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeClass && (
            <div className="text-sm text-muted-foreground">
              Class: <span className="font-medium">{activeClass.name}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={selectedSubjectId}
              onValueChange={(value) => {
                setSelectedSubjectId(value);
                setSelectedChapterId('');
              }}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chapter">Chapter</Label>
            <Select
              value={selectedChapterId}
              onValueChange={setSelectedChapterId}
              disabled={!selectedSubjectId || chapters.length === 0}
            >
              <SelectTrigger id="chapter">
                <SelectValue
                  placeholder={
                    chapters.length === 0
                      ? 'No chapters available'
                      : 'Select chapter'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    Ch. {chapter.chapterNumber}: {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              max="180"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Custom Objectives{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex gap-2">
              <Textarea
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Enter a learning objective..."
                className="min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addObjective();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addObjective}
                disabled={!newObjective.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {customObjectives.length > 0 && (
              <ul className="mt-2 space-y-1">
                {customObjectives.map((obj, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm"
                  >
                    <span className="flex-1">{obj}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeObjective(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty to let AI extract objectives from content
            </p>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <WifiOff className="h-4 w-4" />
              You are offline. Generation requires an internet connection.
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={!isValid || generating || !isOnline}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="h-4 w-4" />
                Offline
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Lesson Plan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
