'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useStudentStore, type Student } from '@/stores/student-store';
import { useClassStore } from '@/stores/class-store';
import { StudentCard } from '@/components/students/student-card';
import { StudentFormDialog } from '@/components/students/student-form-dialog';

export default function StudentsPage() {
  const { activeClassId } = useAppStore();
  const { students, loading, loadStudents } = useStudentStore();
  const { classes, loadClasses } = useClassStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const activeClass = classes.find((c) => c.id === activeClassId);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (activeClassId) {
      loadStudents(activeClassId);
    }
  }, [activeClassId, loadStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.rollNumber.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const handleEdit = (student: Student) => {
    setEditStudent(student);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditStudent(undefined);
    }
  };

  if (!activeClassId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No class selected</h3>
            <p className="text-center text-sm text-gray-500">
              Select a class from the header dropdown to view students
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          {activeClass && (
            <p className="text-sm text-gray-500">{activeClass.name}</p>
          )}
        </div>
        <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {students.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} onEdit={handleEdit} />
          ))}
        </div>
      ) : students.length > 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No results found</h3>
            <p className="text-center text-sm text-gray-500">
              No students match &quot;{searchQuery}&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No students yet</h3>
            <p className="mb-4 text-center text-sm text-gray-500">
              Add students to {activeClass?.name || 'this class'} to get started
            </p>
            <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add First Student
            </Button>
          </CardContent>
        </Card>
      )}

      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        classId={activeClassId}
        editStudent={editStudent}
      />
    </div>
  );
}
