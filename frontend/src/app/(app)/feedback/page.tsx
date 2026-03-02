'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  MessageSquare,
  AlertCircle,
  Sparkles,
  Settings,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useClassStore } from '@/stores/class-store';
import { useAssessmentStore } from '@/stores/assessment-store';
import { useStudentStore } from '@/stores/student-store';
import { useMarksStore } from '@/stores/marks-store';
import {
  useFeedbackStore,
  buildStudentPerformance,
  type StudentPerformance,
} from '@/stores/feedback-store';
import { subjectService } from '@/services/subject-service';
import {
  FEEDBACK_TONES,
  type FeedbackTone,
} from '@/services/feedback-service';
import { FeedbackCard } from '@/components/feedback/feedback-card';
import { ApiKeyDialog } from '@/components/feedback/api-key-dialog';
import type { Subject } from '@/lib/db/schema';
import { toast } from 'sonner';

export default function FeedbackPage() {
  const { activeClassId } = useAppStore();
  const { classes, loadClasses } = useClassStore();
  const { assessments, loadAssessments } = useAssessmentStore();
  const { students, loadStudents } = useStudentStore();
  const { marks, loadMarks } = useMarksStore();
  const {
    feedbacks,
    generating,
    useAI,
    loadFeedbacks,
    generateBulkFeedback,
  } = useFeedbackStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<FeedbackTone>('encouraging');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [allCopied, setAllCopied] = useState(false);

  const activeClass = classes.find((c) => c.id === activeClassId);
  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Load subjects when class changes
  useEffect(() => {
    if (!activeClassId) {
      setSubjects([]);
      setSelectedSubjectId('');
      return;
    }

    subjectService.getByClassId(activeClassId).then((subjs) => {
      setSubjects(subjs);
      if (subjs.length > 0) {
        setSelectedSubjectId(subjs[0].id);
      }
    });

    loadStudents(activeClassId);
  }, [activeClassId, loadStudents]);

  // Load assessments when subject changes
  useEffect(() => {
    if (!selectedSubjectId) return;
    loadAssessments(selectedSubjectId);
  }, [selectedSubjectId, loadAssessments]);

  // Auto-select first assessment and load marks
  useEffect(() => {
    if (assessments.length > 0 && !selectedAssessmentId) {
      setSelectedAssessmentId(assessments[0].id);
    }
  }, [assessments]);

  // Load marks and feedbacks when assessment changes
  useEffect(() => {
    if (!selectedAssessmentId) return;
    loadMarks(selectedAssessmentId);
    loadFeedbacks(selectedAssessmentId);
  }, [selectedAssessmentId, loadMarks, loadFeedbacks]);

  // Build performance data for all students with marks
  const performances: StudentPerformance[] = useMemo(() => {
    if (!selectedAssessment || !selectedSubject) return [];

    return marks
      .map((mark) => {
        const student = students.find((s) => s.id === mark.studentId);
        if (!student) return null;

        return buildStudentPerformance(
          student,
          mark,
          selectedAssessment,
          selectedSubject.name,
          marks
        );
      })
      .filter((p): p is StudentPerformance => p !== null)
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
  }, [marks, students, selectedAssessment, selectedSubject]);

  const handleGenerate = async () => {
    if (performances.length === 0) {
      toast.error('No marks entered for this assessment');
      return;
    }

    setProgress({ current: 0, total: performances.length });

    try {
      await generateBulkFeedback(
        performances,
        selectedTone,
        selectedAssessmentId,
        (current, total) => setProgress({ current, total })
      );

      toast.success(`Generated feedback for ${performances.length} students`);
    } catch (error) {
      toast.error('Failed to generate feedback');
    } finally {
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleCopyAll = async () => {
    if (feedbacks.length === 0) return;

    const allMessages = feedbacks
      .map((f) => {
        const student = students.find((s) => s.id === f.studentId);
        return `[${student?.rollNumber || '?'}] ${student?.name || 'Unknown'}:\n${f.message}`;
      })
      .join('\n\n---\n\n');

    try {
      await navigator.clipboard.writeText(allMessages);
      setAllCopied(true);
      toast.success('All feedback copied');
      setTimeout(() => setAllCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Create a map for quick lookup
  const feedbackByStudent = useMemo(() => {
    return new Map(feedbacks.map((f) => [f.studentId, f]));
  }, [feedbacks]);

  if (!activeClassId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Feedback Generation</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No class selected</h3>
            <p className="text-center text-sm text-gray-500">
              Select a class from the header dropdown to generate feedback
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Generation</h1>
          {activeClass && <p className="text-sm text-gray-500">{activeClass.name}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
          {useAI ? 'AI Enabled' : 'Template Mode'}
        </Button>
      </div>

      {/* Selectors */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Subject</label>
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger>
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
          <label className="text-sm font-medium text-gray-700">Assessment</label>
          <Select
            value={selectedAssessmentId}
            onValueChange={setSelectedAssessmentId}
            disabled={assessments.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={assessments.length === 0 ? 'No assessments' : 'Select assessment'}
              />
            </SelectTrigger>
            <SelectContent>
              {assessments.map((assessment) => (
                <SelectItem key={assessment.id} value={assessment.id}>
                  {assessment.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tone</label>
          <Select value={selectedTone} onValueChange={(v) => setSelectedTone(v as FeedbackTone)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_TONES.map((tone) => (
                <SelectItem key={tone.value} value={tone.value}>
                  {tone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate Button */}
      {selectedAssessmentId && performances.length > 0 && (
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">
                {performances.length} student{performances.length !== 1 ? 's' : ''} with marks
              </p>
              <p className="text-sm text-gray-500">
                Generate {selectedTone} feedback for all students
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Feedback
                </>
              )}
            </Button>
          </CardContent>

          {generating && progress.total > 0 && (
            <div className="border-t px-4 py-3">
              <div className="mb-2 flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          )}
        </Card>
      )}

      {/* Generated Feedback */}
      {feedbacks.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Generated Feedback ({feedbacks.length})
            </h2>
            <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-2">
              {allCopied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy All
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feedbacks.map((feedback) => {
              const student = students.find((s) => s.id === feedback.studentId);
              return (
                <FeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  studentName={student?.name || 'Unknown'}
                  rollNumber={student?.rollNumber || '?'}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Empty State */}
      {feedbacks.length === 0 && selectedAssessmentId && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No feedback generated</h3>
            <p className="mb-4 text-center text-sm text-gray-500">
              {performances.length === 0
                ? 'Enter marks for students first, then generate feedback'
                : 'Click "Generate Feedback" to create messages for all students'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Settings Dialog */}
      <ApiKeyDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
