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
import { useStudentStore, type Student } from '@/stores/student-store';
import { toast } from 'sonner';

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  editStudent?: Student;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  classId,
  editStudent,
}: StudentFormDialogProps) {
  const { createStudent, updateStudent } = useStudentStore();
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editStudent;

  useEffect(() => {
    if (open && editStudent) {
      setName(editStudent.name);
      setRollNumber(editStudent.rollNumber);
      setParentName(editStudent.parentName || '');
      setParentPhone(editStudent.parentPhone || '');
      setParentEmail(editStudent.parentEmail || '');
    } else if (open) {
      setName('');
      setRollNumber('');
      setParentName('');
      setParentPhone('');
      setParentEmail('');
    }
  }, [open, editStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter student name');
      return;
    }

    if (!rollNumber.trim()) {
      toast.error('Please enter roll number');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editStudent) {
        await updateStudent(editStudent.id, {
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          parentName: parentName.trim() || null,
          parentPhone: parentPhone.trim() || null,
          parentEmail: parentEmail.trim() || null,
        });
        toast.success('Student updated');
      } else {
        await createStudent({
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          classId,
          parentName: parentName.trim() || null,
          parentPhone: parentPhone.trim() || null,
          parentEmail: parentEmail.trim() || null,
        });
        toast.success('Student added');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Student operation failed:', error);
      const message = (error as Error).message;
      if (message.includes('UNIQUE constraint')) {
        toast.error('Roll number already exists in this class');
      } else {
        toast.error(isEdit ? 'Failed to update student' : 'Failed to add student');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Student name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  placeholder="e.g., 01, A1"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent/Guardian Name</Label>
              <Input
                id="parentName"
                placeholder="Optional"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Phone</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  placeholder="Optional"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  placeholder="Optional"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
