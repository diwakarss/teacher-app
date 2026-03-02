'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardList, Plus, AlertCircle, Calendar, Hash } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useClassStore } from '@/stores/class-store';
import { useAssessmentStore, type Assessment } from '@/stores/assessment-store';
import { subjectService } from '@/services/subject-service';
import { MarksEntryGrid } from '@/components/marks/marks-entry-grid';
import { AssessmentFormDialog } from '@/components/marks/assessment-form-dialog';
import { ASSESSMENT_TYPES } from '@/services/assessment-service';
import type { Subject } from '@/lib/db/schema';

export default function MarksPage() {
  const { activeClassId } = useAppStore();
  const { classes, loadClasses } = useClassStore();
  const { assessments, loadAssessments, loading: assessmentsLoading } = useAssessmentStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

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

    setLoadingSubjects(true);
    subjectService
      .getByClassId(activeClassId)
      .then((subjs) => {
        setSubjects(subjs);
        if (subjs.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subjs[0].id);
        }
      })
      .finally(() => setLoadingSubjects(false));
  }, [activeClassId]);

  // Load assessments when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setSelectedAssessmentId('');
      return;
    }

    loadAssessments(selectedSubjectId);
  }, [selectedSubjectId, loadAssessments]);

  // Auto-select first assessment
  useEffect(() => {
    if (assessments.length > 0 && !selectedAssessmentId) {
      setSelectedAssessmentId(assessments[0].id);
    } else if (assessments.length === 0) {
      setSelectedAssessmentId('');
    }
  }, [assessments]);

  if (!activeClassId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No class selected</h3>
            <p className="text-center text-sm text-gray-500">
              Select a class from the header dropdown to enter marks
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subjects.length === 0 && !loadingSubjects) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
          {activeClass && <p className="text-sm text-gray-500">{activeClass.name}</p>}
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No subjects yet</h3>
            <p className="text-center text-sm text-gray-500">
              Add subjects to this class first (go to Classes → select class → add subjects)
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
          <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
          {activeClass && <p className="text-sm text-gray-500">{activeClass.name}</p>}
        </div>
        {selectedSubjectId && (
          <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
        )}
      </div>

      {/* Subject & Assessment Selectors */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
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
                placeholder={
                  assessmentsLoading
                    ? 'Loading...'
                    : assessments.length === 0
                    ? 'No assessments'
                    : 'Select assessment'
                }
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
      </div>

      {/* Assessment Info Card */}
      {selectedAssessment && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{selectedAssessment.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Max: {selectedAssessment.maxMarks}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(selectedAssessment.date).toLocaleDateString()}
              </span>
              <span>
                {ASSESSMENT_TYPES.find((t) => t.value === selectedAssessment.type)?.label || selectedAssessment.type}
              </span>
              <span>Term {selectedAssessment.term}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marks Entry Grid */}
      {selectedAssessment ? (
        <MarksEntryGrid assessment={selectedAssessment} classId={activeClassId} />
      ) : assessments.length === 0 && selectedSubjectId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No assessments yet</h3>
            <p className="mb-4 text-center text-sm text-gray-500">
              Create an assessment to start entering marks for {selectedSubject?.name}
            </p>
            <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Assessment
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Assessment Form Dialog */}
      {selectedSubjectId && (
        <AssessmentFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          classId={activeClassId}
          subjectId={selectedSubjectId}
        />
      )}
    </div>
  );
}
