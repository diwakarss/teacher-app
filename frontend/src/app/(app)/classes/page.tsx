'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClassStore } from '@/stores/class-store';
import { ClassFormDialog } from '@/components/classes/class-form-dialog';
import { ClassCardSkeleton } from '@/components/ui/loading-skeleton';
import { initializeDb } from '@/lib/db/database';

export default function ClassesPage() {
  const { classes, loading, loadClasses } = useClassStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initializeDb().then(() => {
      setDbReady(true);
      loadClasses();
    });
  }, [loadClasses]);

  if (!dbReady || loading) {
    return (
      <div className="p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <Button size="sm" className="gap-1" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Add Class
        </Button>
      </div>

      {classes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No classes yet</h3>
            <p className="mb-4 text-center text-sm text-gray-500">
              Create your first class to get started
            </p>
            <Button className="gap-1" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              Create Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`}>
              <Card className="transition-colors hover:bg-gray-50">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{cls.name}</CardTitle>
                        <p className="text-sm text-gray-500">{cls.academicYear}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ClassFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
