'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Pencil, Trash2, Phone, Mail, User } from 'lucide-react';
import { useStudentStore, type Student } from '@/stores/student-store';
import { toast } from 'sonner';

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
}

export function StudentCard({ student, onEdit }: StudentCardProps) {
  const { deleteStudent } = useStudentStore();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudent(student.id);
      toast.success('Student deleted');
    } catch (error) {
      console.error('Failed to delete student:', error);
      toast.error('Failed to delete student');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                {student.rollNumber}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{student.name}</h3>
                {student.parentName && (
                  <p className="flex items-center gap-1 text-sm text-gray-500">
                    <User className="h-3 w-3" />
                    {student.parentName}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(student)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(student.parentPhone || student.parentEmail) && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
              {student.parentPhone && (
                <a
                  href={`tel:${student.parentPhone}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Phone className="h-3 w-3" />
                  {student.parentPhone}
                </a>
              )}
              {student.parentEmail && (
                <a
                  href={`mailto:${student.parentEmail}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Mail className="h-3 w-3" />
                  {student.parentEmail}
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {student.name}? This will also remove all
              their marks and records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
