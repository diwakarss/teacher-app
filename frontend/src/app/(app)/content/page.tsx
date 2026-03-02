'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Search, AlertCircle, BookOpen } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useContentStore } from '@/stores/content-store';
import { useClassStore } from '@/stores/class-store';
import { subjectService } from '@/services/subject-service';
import { ChapterCard } from '@/components/content/chapter-card';
import { UploadDialog } from '@/components/content/upload-dialog';
import { ChapterCardSkeleton } from '@/components/ui/loading-skeleton';
import type { Subject } from '@/lib/db/schema';

export default function ContentPage() {
  const { activeClassId } = useAppStore();
  const { chapters, loading, loadChapters } = useContentStore();
  const { classes, loadClasses } = useClassStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeClass = classes.find((c) => c.id === activeClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    async function loadSubjects() {
      if (activeClassId) {
        const subs = await subjectService.getByClassId(activeClassId);
        setSubjects(subs);
        if (subs.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subs[0].id);
        }
      }
    }
    loadSubjects();
  }, [activeClassId, selectedSubjectId]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadChapters(selectedSubjectId);
    }
  }, [selectedSubjectId, loadChapters]);

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const query = searchQuery.toLowerCase();
    return chapters.filter((c) => c.name.toLowerCase().includes(query));
  }, [chapters, searchQuery]);

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open && selectedSubjectId) {
      loadChapters(selectedSubjectId);
    }
  };

  if (!activeClassId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No class selected</h3>
            <p className="text-center text-sm text-gray-500">
              Select a class from the header dropdown to view content
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          {activeClass && <p className="text-sm text-gray-500">{activeClass.name}</p>}
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No subjects yet</h3>
            <p className="text-center text-sm text-gray-500">
              Add subjects to {activeClass?.name || 'this class'} first, then upload content
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
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          {activeClass && <p className="text-sm text-gray-500">{activeClass.name}</p>}
        </div>
        <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Select value={selectedSubjectId || ''} onValueChange={setSelectedSubjectId}>
          <SelectTrigger className="w-[180px]">
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

        {chapters.length > 0 && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ChapterCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredChapters.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChapters.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      ) : chapters.length > 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No results found</h3>
            <p className="text-center text-sm text-gray-500">
              No chapters match &quot;{searchQuery}&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No chapters yet</h3>
            <p className="mb-4 text-center text-sm text-gray-500">
              Upload PDF or photos to add chapters to {selectedSubject?.name || 'this subject'}
            </p>
            <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Upload First Chapter
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedSubjectId && (
        <UploadDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          subjectId={selectedSubjectId}
        />
      )}
    </div>
  );
}
