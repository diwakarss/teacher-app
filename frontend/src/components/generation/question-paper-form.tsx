'use client';

import { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  FileQuestion,
  WifiOff,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useClassStore } from '@/stores/class-store';
import { useContentStore } from '@/stores/content-store';
import { subjectService } from '@/services/subject-service';
import type { GenerateQuestionPaperParams, QuestionPaperDifficulty } from '@/services/question-paper-service';
import {
  type PaperFormat,
  type SectionConfig,
  type QuestionType,
  PAPER_FORMAT_PRESETS,
  QUESTION_TYPE_LABELS,
  getDefaultSections,
  calculateTotalMarks,
} from '@/lib/prompts/question-paper-prompt';
import type { Subject } from '@/lib/db/schema';

interface QuestionPaperFormProps {
  onGenerate: (params: GenerateQuestionPaperParams) => Promise<void>;
  generating: boolean;
}

// ── Section reducer ─────────────────────────────────────────────────────────

type SectionAction =
  | { type: 'set'; sections: SectionConfig[] }
  | { type: 'add'; questionType: QuestionType }
  | { type: 'remove'; index: number }
  | { type: 'update'; index: number; field: keyof SectionConfig; value: string | number }
  | { type: 'move'; index: number; direction: 'up' | 'down' };

function sectionReducer(state: SectionConfig[], action: SectionAction): SectionConfig[] {
  switch (action.type) {
    case 'set':
      return action.sections;
    case 'add':
      return [...state, { questionType: action.questionType, count: 5, marksEach: 1 }];
    case 'remove':
      return state.filter((_, i) => i !== action.index);
    case 'update': {
      const next = [...state];
      next[action.index] = { ...next[action.index], [action.field]: action.value };
      return next;
    }
    case 'move': {
      const next = [...state];
      const target = action.direction === 'up' ? action.index - 1 : action.index + 1;
      if (target < 0 || target >= next.length) return state;
      [next[action.index], next[target]] = [next[target], next[action.index]];
      return next;
    }
  }
}

// ── Available question types for the "add section" picker ───────────────────

const QUESTION_TYPES: QuestionType[] = [
  'define',
  'fill_blank',
  'fill_blank_word_bank',
  'true_false',
  'complete_paragraph',
  'classify',
  'comparison_table',
  'match',
  'short_answer',
  'long_answer',
  'advantages_disadvantages',
  'mcq',
];

const DIFFICULTIES: { value: QuestionPaperDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

const SECTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('ct');
  const [difficulty, setDifficulty] = useState<QuestionPaperDifficulty>('medium');
  const [totalMarks, setTotalMarks] = useState<string>('15');
  const [duration, setDuration] = useState<string>('30');
  const [grade, setGrade] = useState<string>('');
  const [sections, dispatch] = useReducer(sectionReducer, getDefaultSections('ct'));
  const [addingType, setAddingType] = useState<QuestionType | ''>('');

  const activeClass = classes.find((c) => c.id === activeClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Auto-set grade from class name if it contains a number
  useEffect(() => {
    if (activeClass && !grade) {
      const match = activeClass.name.match(/\d+/);
      if (match) setGrade(`Grade ${match[0]}`);
    }
  }, [activeClass, grade]);

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

  // Update defaults when paper format changes
  useEffect(() => {
    const preset = PAPER_FORMAT_PRESETS[paperFormat];
    setTotalMarks(preset.defaultMarks.toString());
    setDuration(preset.defaultDuration.toString());
    dispatch({ type: 'set', sections: getDefaultSections(paperFormat) });
  }, [paperFormat]);

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const selectAllChapters = () => setSelectedChapterIds(chapters.map((c) => c.id));
  const deselectAllChapters = () => setSelectedChapterIds([]);

  const calculatedTotal = useMemo(() => calculateTotalMarks(sections), [sections]);
  const marksMatch = calculatedTotal === parseInt(totalMarks);

  const handleAddSection = () => {
    if (!addingType) return;
    dispatch({ type: 'add', questionType: addingType as QuestionType });
    setAddingType('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      toast.error('Generation requires an internet connection');
      return;
    }

    if (!selectedSubject || selectedChapterIds.length === 0) return;
    if (sections.length === 0) {
      toast.error('Add at least one section');
      return;
    }

    // Auto-adjust totalMarks to match sections if they differ
    const marks = calculatedTotal;

    const selectedChapters = chapters.filter((c) =>
      selectedChapterIds.includes(c.id)
    );

    const params: GenerateQuestionPaperParams = {
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      grade: grade || 'Grade 3',
      chapterIds: selectedChapterIds,
      chaptersContent: selectedChapters.map((c) => ({
        name: c.name,
        content: c.content,
      })),
      totalMarks: marks,
      duration: parseInt(duration) || 30,
      difficulty,
      paperFormat,
      sections,
    };

    await onGenerate(params);
  };

  const isValid =
    selectedSubjectId &&
    selectedChapterIds.length > 0 &&
    sections.length > 0 &&
    calculatedTotal > 0 &&
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

          {/* Subject selector */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={selectedSubjectId}
              onValueChange={setSelectedSubjectId}
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

          {/* Chapter selector */}
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
                  <Button type="button" variant="ghost" size="sm" onClick={selectAllChapters} className="h-7 text-xs">
                    Select All
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={deselectAllChapters} className="h-7 text-xs">
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
                    <label htmlFor={chapter.id} className="flex-1 cursor-pointer text-sm">
                      Ch. {chapter.chapterNumber}: {chapter.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Paper format + difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paperFormat">Paper Format</Label>
              <Select value={paperFormat} onValueChange={(v) => setPaperFormat(v as PaperFormat)}>
                <SelectTrigger id="paperFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PAPER_FORMAT_PRESETS) as [PaperFormat, typeof PAPER_FORMAT_PRESETS.ct][]).map(
                    ([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {PAPER_FORMAT_PRESETS[paperFormat].description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as QuestionPaperDifficulty)}>
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

          {/* Grade + Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Grade 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                min="5"
                max="200"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="10"
                max="180"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Section Builder */}
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Sections</Label>
              <Badge variant={marksMatch ? 'default' : 'destructive'} className="text-xs">
                {calculatedTotal} / {totalMarks} marks
              </Badge>
            </div>

            {/* Existing sections */}
            <div className="space-y-2">
              {sections.map((section, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-md border bg-gray-50 p-2"
                >
                  <span className="text-xs font-semibold text-gray-500 w-6">
                    {SECTION_LETTERS[idx]}
                  </span>

                  <Select
                    value={section.questionType}
                    onValueChange={(v) =>
                      dispatch({ type: 'update', index: idx, field: 'questionType', value: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((qt) => (
                        <SelectItem key={qt} value={qt}>
                          {QUESTION_TYPE_LABELS[qt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={section.count}
                    onChange={(e) =>
                      dispatch({
                        type: 'update',
                        index: idx,
                        field: 'count',
                        value: parseInt(e.target.value) || 1,
                      })
                    }
                    className="h-8 w-16 text-xs text-center"
                    title="Number of questions"
                  />

                  <span className="text-xs text-gray-400">&times;</span>

                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={section.marksEach}
                    onChange={(e) =>
                      dispatch({
                        type: 'update',
                        index: idx,
                        field: 'marksEach',
                        value: parseInt(e.target.value) || 1,
                      })
                    }
                    className="h-8 w-14 text-xs text-center"
                    title="Marks per question"
                  />

                  <span className="text-xs text-gray-500 w-8 text-right">
                    = {section.count * section.marksEach}
                  </span>

                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      disabled={idx === 0}
                      onClick={() => dispatch({ type: 'move', index: idx, direction: 'up' })}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      disabled={idx === sections.length - 1}
                      onClick={() => dispatch({ type: 'move', index: idx, direction: 'down' })}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => dispatch({ type: 'remove', index: idx })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add section */}
            <div className="flex items-center gap-2">
              <Select value={addingType} onValueChange={(v) => setAddingType(v as QuestionType)}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Add a section..." />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((qt) => (
                    <SelectItem key={qt} value={qt}>
                      {QUESTION_TYPE_LABELS[qt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={!addingType}
                onClick={handleAddSection}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {!marksMatch && (
              <p className="text-xs text-destructive">
                Section total ({calculatedTotal}) does not match total marks ({totalMarks}).
                The paper will be generated with {calculatedTotal} marks.
              </p>
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
