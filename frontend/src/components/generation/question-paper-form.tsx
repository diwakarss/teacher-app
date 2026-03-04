'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileQuestion, Info, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useClassStore } from '@/stores/class-store';
import { useContentStore } from '@/stores/content-store';
import { subjectService } from '@/services/subject-service';
import {
  type GenerateQuestionPaperParams,
  type QuestionPaperDifficulty,
  type QuestionPaperTemplate,
} from '@/services/question-paper-service';
import { getDefaultDistribution } from '@/lib/prompts/question-paper-prompt';
import type { Subject } from '@/lib/db/schema';

interface QuestionPaperFormProps {
  onGenerate: (params: GenerateQuestionPaperParams) => Promise<void>;
  generating: boolean;
}

const TEMPLATES: { value: QuestionPaperTemplate; label: string; marks: number; duration: number }[] = [
  { value: 'unit_test', label: 'Unit Test', marks: 40, duration: 45 },
  { value: 'monthly_test', label: 'Monthly Test', marks: 50, duration: 60 },
  { value: 'term_exam', label: 'Term Exam', marks: 100, duration: 180 },
  { value: 'custom', label: 'Custom', marks: 50, duration: 60 },
];

const DIFFICULTIES: { value: QuestionPaperDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

export function QuestionPaperForm({
  onGenerate,
  generating,
}: QuestionPaperFormProps) {
  const isOnline = useOnlineStatus();
  const { activeClassId } = useAppStore();
  const { classes, loadClasses } = useClassStore();
  const { chapters, loadChapters } = useContentStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [template, setTemplate] = useState<QuestionPaperTemplate>('unit_test');
  const [difficulty, setDifficulty] = useState<QuestionPaperDifficulty>('medium');
  const [totalMarks, setTotalMarks] = useState<string>('40');
  const [duration, setDuration] = useState<string>('45');
  const [useCustomDistribution, setUseCustomDistribution] = useState(false);
  const [sectionA, setSectionA] = useState({ count: 10, marksEach: 1 });
  const [sectionB, setSectionB] = useState({ count: 5, marksEach: 2 });
  const [sectionC, setSectionC] = useState({ count: 4, marksEach: 5 });

  const activeClass = classes.find((c) => c.id === activeClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

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
      setSelectedChapterIds([]);
    }
  }, [selectedSubjectId, loadChapters]);

  // Update marks/duration when template changes
  useEffect(() => {
    const templateInfo = TEMPLATES.find((t) => t.value === template);
    if (templateInfo && template !== 'custom') {
      setTotalMarks(templateInfo.marks.toString());
      setDuration(templateInfo.duration.toString());

      // Update section distribution based on template
      const dist = getDefaultDistribution(templateInfo.marks, template);
      setSectionA(dist.sectionA);
      setSectionB(dist.sectionB);
      setSectionC(dist.sectionC);
    }
  }, [template]);

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const selectAllChapters = () => {
    setSelectedChapterIds(chapters.map((c) => c.id));
  };

  const deselectAllChapters = () => {
    setSelectedChapterIds([]);
  };

  const calculatedTotal = useMemo(() => {
    return (
      sectionA.count * sectionA.marksEach +
      sectionB.count * sectionB.marksEach +
      sectionC.count * sectionC.marksEach
    );
  }, [sectionA, sectionB, sectionC]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      toast.error('Generation requires an internet connection');
      return;
    }

    if (!selectedSubject || selectedChapterIds.length === 0) return;

    const selectedChapters = chapters.filter((c) =>
      selectedChapterIds.includes(c.id)
    );

    const params: GenerateQuestionPaperParams = {
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      chapterIds: selectedChapterIds,
      chaptersContent: selectedChapters.map((c) => ({
        name: c.name,
        content: c.content,
      })),
      totalMarks: parseInt(totalMarks) || 50,
      duration: parseInt(duration) || 60,
      difficulty,
      template,
      sectionDistribution: useCustomDistribution
        ? { sectionA, sectionB, sectionC }
        : undefined,
    };

    await onGenerate(params);
  };

  const isValid =
    selectedSubjectId &&
    selectedChapterIds.length > 0 &&
    totalMarks &&
    parseInt(totalMarks) > 0 &&
    duration &&
    parseInt(duration) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-primary" />
          Generate Question Paper
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
            <div className="flex items-center justify-between">
              <Label>
                Chapters{' '}
                <span className="text-muted-foreground">
                  ({selectedChapterIds.length} selected)
                </span>
              </Label>
              {chapters.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllChapters}
                    className="h-7 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllChapters}
                    className="h-7 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
              {chapters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No chapters available. Upload content first.
                </p>
              ) : (
                chapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center gap-2">
                    <Checkbox
                      id={chapter.id}
                      checked={selectedChapterIds.includes(chapter.id)}
                      onCheckedChange={() => toggleChapter(chapter.id)}
                    />
                    <label
                      htmlFor={chapter.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      Ch. {chapter.chapterNumber}: {chapter.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={template}
                onValueChange={(v) => setTemplate(v as QuestionPaperTemplate)}
              >
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}{' '}
                      {t.value !== 'custom' && (
                        <span className="text-muted-foreground">
                          ({t.marks} marks)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as QuestionPaperDifficulty)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                min="20"
                max="200"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                disabled={template !== 'custom'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="240"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={template !== 'custom'}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="customDist"
                  checked={useCustomDistribution}
                  onCheckedChange={(checked: boolean | 'indeterminate') =>
                    setUseCustomDistribution(checked === true)
                  }
                />
                <label htmlFor="customDist" className="text-sm font-medium">
                  Customize Section Distribution
                </label>
              </div>
              {useCustomDistribution && (
                <span
                  className={`text-sm ${
                    calculatedTotal === parseInt(totalMarks)
                      ? 'text-green-600'
                      : 'text-destructive'
                  }`}
                >
                  Total: {calculatedTotal}/{totalMarks}
                </span>
              )}
            </div>

            {useCustomDistribution && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  Section A: MCQ/Fill blanks | Section B: Short answer | Section
                  C: Long answer
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Section A</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        value={sectionA.count}
                        onChange={(e) =>
                          setSectionA({
                            ...sectionA,
                            count: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-xs"
                        placeholder="Count"
                      />
                      <span className="flex items-center text-xs">×</span>
                      <Input
                        type="number"
                        min="1"
                        value={sectionA.marksEach}
                        onChange={(e) =>
                          setSectionA({
                            ...sectionA,
                            marksEach: parseInt(e.target.value) || 1,
                          })
                        }
                        className="h-8 w-14 text-xs"
                        placeholder="Marks"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Section B</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        value={sectionB.count}
                        onChange={(e) =>
                          setSectionB({
                            ...sectionB,
                            count: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-xs"
                        placeholder="Count"
                      />
                      <span className="flex items-center text-xs">×</span>
                      <Input
                        type="number"
                        min="1"
                        value={sectionB.marksEach}
                        onChange={(e) =>
                          setSectionB({
                            ...sectionB,
                            marksEach: parseInt(e.target.value) || 1,
                          })
                        }
                        className="h-8 w-14 text-xs"
                        placeholder="Marks"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Section C</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        value={sectionC.count}
                        onChange={(e) =>
                          setSectionC({
                            ...sectionC,
                            count: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-xs"
                        placeholder="Count"
                      />
                      <span className="flex items-center text-xs">×</span>
                      <Input
                        type="number"
                        min="1"
                        value={sectionC.marksEach}
                        onChange={(e) =>
                          setSectionC({
                            ...sectionC,
                            marksEach: parseInt(e.target.value) || 1,
                          })
                        }
                        className="h-8 w-14 text-xs"
                        placeholder="Marks"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!useCustomDistribution && (
              <div className="text-xs text-muted-foreground">
                Section A: {sectionA.count}×{sectionA.marksEach} = {sectionA.count * sectionA.marksEach} marks |
                Section B: {sectionB.count}×{sectionB.marksEach} = {sectionB.count * sectionB.marksEach} marks |
                Section C: {sectionC.count}×{sectionC.marksEach} = {sectionC.count * sectionC.marksEach} marks
              </div>
            )}
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
                <FileQuestion className="h-4 w-4" />
                Generate Question Paper
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
