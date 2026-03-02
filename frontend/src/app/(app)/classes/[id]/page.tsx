'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  BookOpen,
  Edit,
  Trash2,
  Plus,
  Users,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { useClassStore } from '@/stores/class-store';
import { subjectService, type IGCSESubjectTemplate, IGCSE_SUBJECTS } from '@/services/subject-service';
import type { Subject } from '@/lib/db/schema';
import { ClassFormDialog } from '@/components/classes/class-form-dialog';
import { SubjectFormDialog } from '@/components/classes/subject-form-dialog';
import { initializeDb } from '@/lib/db/database';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { classes, loadClasses, deleteClass, getClassById } = useClassStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cls = getClassById(id);

  useEffect(() => {
    const init = async () => {
      await initializeDb();
      await loadClasses();
      const subs = await subjectService.getByClassId(id);
      setSubjects(subs);
      setLoading(false);
    };
    init();
  }, [id, loadClasses]);

  const handleDeleteClass = async () => {
    setDeleting(true);
    try {
      await deleteClass(id);
      toast.success('Class deleted');
      router.push('/classes');
    } catch (error) {
      toast.error('Failed to delete class');
      setDeleting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await subjectService.delete(subjectId);
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      toast.success('Subject removed');
    } catch (error) {
      toast.error('Failed to remove subject');
    }
  };

  const handleSubjectCreated = (subject: Subject) => {
    setSubjects((prev) => [...prev, subject].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleSubjectUpdated = (subject: Subject) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === subject.id ? subject : s)).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const handleAddIGCSESubjects = async (selected: string[]) => {
    try {
      const created = await subjectService.createMany(id, selected);
      setSubjects((prev) => [...prev, ...created].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Added ${created.length} subjects`);
    } catch (error) {
      toast.error('Failed to add subjects');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-4">
        <p className="mb-4 text-gray-500">Class not found</p>
        <Button variant="outline" asChild>
          <Link href="/classes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/classes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{cls.name}</CardTitle>
                <p className="text-sm text-gray-500">{cls.academicYear}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/students?classId=${id}`}>
              <Card className="transition-colors hover:bg-gray-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Students</p>
                    <p className="font-medium">View All</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/marks?classId=${id}`}>
              <Card className="transition-colors hover:bg-gray-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Assessments</p>
                    <p className="font-medium">View All</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subjects</h2>
        <div className="flex gap-2">
          <IGCSESubjectsButton
            existingSubjects={subjects.map((s) => s.name)}
            onAdd={handleAddIGCSESubjects}
          />
          <Button size="sm" onClick={() => setShowSubjectDialog(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Custom
          </Button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <BookOpen className="mb-3 h-10 w-10 text-gray-300" />
            <p className="mb-2 text-sm text-gray-500">No subjects added yet</p>
            <p className="mb-4 text-center text-xs text-gray-400">
              Add IGCSE subjects from templates or create custom ones
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {subjects.map((subject) => (
            <Card key={subject.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{subject.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSubject(subject);
                      setShowSubjectDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDeleteSubject(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClassFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editClass={cls}
      />

      <SubjectFormDialog
        open={showSubjectDialog}
        onOpenChange={(open) => {
          setShowSubjectDialog(open);
          if (!open) setEditingSubject(null);
        }}
        classId={id}
        editSubject={editingSubject ?? undefined}
        onCreated={handleSubjectCreated}
        onUpdated={handleSubjectUpdated}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{cls.name}&rdquo;? This will also delete all
              students, subjects, and marks associated with this class. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClass} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IGCSESubjectsButton({
  existingSubjects,
  onAdd,
}: {
  existingSubjects: string[];
  onAdd: (subjects: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const availableSubjects = IGCSE_SUBJECTS.filter(
    (s) => !existingSubjects.includes(s.name)
  );

  const handleToggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleAdd = () => {
    onAdd(selected);
    setSelected([]);
    setOpen(false);
  };

  if (availableSubjects.length === 0) {
    return null;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        IGCSE
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add IGCSE Subjects</DialogTitle>
            <DialogDescription>
              Select subjects to add to this class. Already added subjects are hidden.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {availableSubjects.map((subject) => (
              <Button
                key={subject.code}
                variant={selected.includes(subject.name) ? 'default' : 'outline'}
                className="h-auto justify-start py-2 text-left"
                onClick={() => handleToggle(subject.name)}
              >
                <div>
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-xs opacity-70">{subject.code}</div>
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selected.length === 0}>
              Add {selected.length > 0 && `(${selected.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
