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
import { subjectService } from '@/services/subject-service';
import type { Subject } from '@/lib/db/schema';
import { toast } from 'sonner';

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  editSubject?: Subject;
  onCreated?: (subject: Subject) => void;
  onUpdated?: (subject: Subject) => void;
}

export function SubjectFormDialog({
  open,
  onOpenChange,
  classId,
  editSubject,
  onCreated,
  onUpdated,
}: SubjectFormDialogProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editSubject;

  useEffect(() => {
    if (open) {
      setName(editSubject?.name || '');
    }
  }, [open, editSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editSubject) {
        const updated = await subjectService.update(editSubject.id, { name: name.trim() });
        onUpdated?.(updated);
        toast.success('Subject updated');
      } else {
        const created = await subjectService.create({ name: name.trim(), classId });
        onCreated?.(created);
        toast.success('Subject created');
      }
      onOpenChange(false);
      setName('');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update subject' : 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Subject' : 'Add Custom Subject'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                placeholder="e.g., Tamil, Environmental Science"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Subject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
