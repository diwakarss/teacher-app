'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { useMarksStore, type MarkWithStudent } from '@/stores/marks-store';
import { useStudentStore } from '@/stores/student-store';
import type { Assessment, Student } from '@/lib/db/schema';
import { calculateIGCSEGrade, getGradeColor } from '@/services/marks-service';
import { toast } from 'sonner';

interface MarksEntryGridProps {
  assessment: Assessment;
  classId: string;
}

interface MarkEntry {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: string;
  remarks: string;
  hasChanged: boolean;
  existingMarkId?: string;
}

export function MarksEntryGrid({ assessment, classId }: MarksEntryGridProps) {
  const { marks, loadMarks, bulkUpsert } = useMarksStore();
  const { students, loadStudents } = useStudentStore();
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Load students and marks when assessment changes
  useEffect(() => {
    loadStudents(classId);
    loadMarks(assessment.id);
  }, [assessment.id, classId, loadStudents, loadMarks]);

  // Build entry grid from students + existing marks
  useEffect(() => {
    const marksMap = new Map(marks.map((m) => [m.studentId, m]));

    const newEntries: MarkEntry[] = students.map((student) => {
      const existingMark = marksMap.get(student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        marksObtained: existingMark ? String(existingMark.marksObtained) : '',
        remarks: existingMark?.remarks || '',
        hasChanged: false,
        existingMarkId: existingMark?.id,
      };
    });

    setEntries(newEntries);
  }, [students, marks]);

  const handleMarksChange = useCallback(
    (studentId: string, value: string) => {
      // Only allow numbers within valid range
      if (value !== '' && !/^\d+$/.test(value)) return;

      const numValue = parseInt(value, 10);
      if (value !== '' && (numValue < 0 || numValue > assessment.maxMarks)) return;

      setEntries((prev) =>
        prev.map((entry) =>
          entry.studentId === studentId
            ? { ...entry, marksObtained: value, hasChanged: true }
            : entry
        )
      );
    },
    [assessment.maxMarks]
  );

  const handleRemarksChange = useCallback((studentId: string, value: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId
          ? { ...entry, remarks: value, hasChanged: true }
          : entry
      )
    );
  }, []);

  const handleSave = async () => {
    const changedEntries = entries.filter(
      (e) => e.hasChanged && e.marksObtained !== ''
    );

    if (changedEntries.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      await bulkUpsert(
        assessment.id,
        changedEntries.map((e) => ({
          studentId: e.studentId,
          marksObtained: parseInt(e.marksObtained, 10),
          remarks: e.remarks || undefined,
        }))
      );

      // Reset hasChanged flags
      setEntries((prev) =>
        prev.map((entry) => ({ ...entry, hasChanged: false }))
      );

      toast.success(`Saved marks for ${changedEntries.length} student(s)`);
    } catch (error) {
      console.error('Failed to save marks:', error);
      toast.error('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = entries.some((e) => e.hasChanged);

  // Calculate stats
  const enteredMarks = entries.filter((e) => e.marksObtained !== '');
  const average =
    enteredMarks.length > 0
      ? enteredMarks.reduce((sum, e) => sum + parseInt(e.marksObtained, 10), 0) /
        enteredMarks.length
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            Entered: {enteredMarks.length}/{students.length}
          </span>
          {enteredMarks.length > 0 && (
            <span>Avg: {average.toFixed(1)}/{assessment.maxMarks}</span>
          )}
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Marks
            </>
          )}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Roll</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-[100px] text-center">
                Marks / {assessment.maxMarks}
              </TableHead>
              <TableHead className="w-[80px] text-center">Grade</TableHead>
              <TableHead className="w-[200px]">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                  No students in this class. Add students first.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const marksNum = entry.marksObtained
                  ? parseInt(entry.marksObtained, 10)
                  : null;
                const grade =
                  marksNum !== null
                    ? calculateIGCSEGrade(marksNum, assessment.maxMarks)
                    : null;

                return (
                  <TableRow
                    key={entry.studentId}
                    className={entry.hasChanged ? 'bg-amber-50' : ''}
                  >
                    <TableCell className="font-medium">
                      {entry.rollNumber}
                    </TableCell>
                    <TableCell>{entry.studentName}</TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={entry.marksObtained}
                        onChange={(e) =>
                          handleMarksChange(entry.studentId, e.target.value)
                        }
                        className="h-8 text-center"
                        placeholder="—"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {grade && (
                        <Badge
                          variant="secondary"
                          className={getGradeColor(grade)}
                        >
                          {grade}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={entry.remarks}
                        onChange={(e) =>
                          handleRemarksChange(entry.studentId, e.target.value)
                        }
                        className="h-8"
                        placeholder="Optional"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
