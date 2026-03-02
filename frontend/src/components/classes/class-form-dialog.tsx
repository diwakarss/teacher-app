'use client';

import { useState } from 'react';
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
import { useClassStore, type Class } from '@/stores/class-store';
import { toast } from 'sonner';

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClass?: Class;
}

const currentYear = new Date().getFullYear();
const academicYears = [
  `${currentYear - 1}-${currentYear}`,
  `${currentYear}-${currentYear + 1}`,
  `${currentYear + 1}-${currentYear + 2}`,
];

export function ClassFormDialog({ open, onOpenChange, editClass }: ClassFormDialogProps) {
  const { createClass, updateClass } = useClassStore();
  const [name, setName] = useState(editClass?.name || '');
  const [academicYear, setAcademicYear] = useState(
    editClass?.academicYear || `${currentYear}-${currentYear + 1}`
  );
  const [saving, setSaving] = useState(false);

  const isEdit = !!editClass;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateClass(editClass.id, { name: name.trim(), academicYear });
        toast.success('Class updated');
      } else {
        await createClass(name.trim(), academicYear);
        toast.success('Class created');
      }
      onOpenChange(false);
      setName('');
    } catch (error) {
      console.error('Class operation failed:', error);
      toast.error(isEdit ? 'Failed to update class' : 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(editClass?.name || '');
      setAcademicYear(editClass?.academicYear || `${currentYear}-${currentYear + 1}`);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Class' : 'Create New Class'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                placeholder="e.g., Grade 10A, Class 5B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger id="academicYear">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
