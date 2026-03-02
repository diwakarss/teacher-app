'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAssessmentStore, type Assessment } from '@/stores/assessment-store';
import { ASSESSMENT_TYPES, type AssessmentType } from '@/services/assessment-service';
import { toast } from 'sonner';

interface AssessmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  subjectId: string;
  editAssessment?: Assessment;
}

export function AssessmentFormDialog({
  open,
  onOpenChange,
  classId,
  subjectId,
  editAssessment,
}: AssessmentFormDialogProps) {
  const { createAssessment, updateAssessment } = useAssessmentStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<AssessmentType>('unit');
  const [maxMarks, setMaxMarks] = useState('100');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [term, setTerm] = useState('1');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editAssessment;

  useEffect(() => {
    if (open && editAssessment) {
      setName(editAssessment.name);
      setType(editAssessment.type as AssessmentType);
      setMaxMarks(String(editAssessment.maxMarks));
      setDate(editAssessment.date);
      setTerm(String(editAssessment.term));
    } else if (open) {
      setName('');
      setType('unit');
      setMaxMarks('100');
      setDate(new Date().toISOString().split('T')[0]);
      setTerm('1');
    }
  }, [open, editAssessment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter assessment name');
      return;
    }

    const maxMarksNum = parseInt(maxMarks, 10);
    if (isNaN(maxMarksNum) || maxMarksNum <= 0) {
      toast.error('Please enter valid max marks');
      return;
    }

    const termNum = parseInt(term, 10);
    if (isNaN(termNum) || termNum < 1 || termNum > 3) {
      toast.error('Please select a valid term');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editAssessment) {
        await updateAssessment(editAssessment.id, {
          name: name.trim(),
          type,
          maxMarks: maxMarksNum,
          date,
          term: termNum,
        });
        toast.success('Assessment updated');
      } else {
        await createAssessment({
          name: name.trim(),
          type,
          subjectId,
          classId,
          maxMarks: maxMarksNum,
          date,
          term: termNum,
        });
        toast.success('Assessment created');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Assessment operation failed:', error);
      toast.error(isEdit ? 'Failed to update assessment' : 'Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Assessment' : 'Create Assessment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assessment Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Unit Test 1, Mid-Term Exam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AssessmentType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMarks">Max Marks *</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  min="1"
                  max="1000"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger id="term">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
