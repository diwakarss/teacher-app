'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
import { ArrowLeft, Save, Trash2, FileText, Image, Loader2 } from 'lucide-react';
import { useContentStore } from '@/stores/content-store';
import { chapterService } from '@/services/chapter-service';
import { ContentViewer } from '@/components/content/content-viewer';
import { toast } from 'sonner';
import type { Chapter } from '@/lib/db/schema';

type Difficulty = 'easy' | 'medium' | 'hard' | null;

export default function ChapterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { deleteChapter } = useContentStore();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [name, setName] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const chapterId = params.id as string;

  useEffect(() => {
    async function loadChapter() {
      if (!chapterId) return;

      setLoading(true);
      try {
        const data = await chapterService.getById(chapterId);
        if (data) {
          setChapter(data);
          setName(data.name);
          setChapterNumber(data.chapterNumber);
          setContent(data.content);
          setDifficulty(data.difficulty as Difficulty);
        }
      } catch (error) {
        console.error('Failed to load chapter:', error);
        toast.error('Failed to load chapter');
      } finally {
        setLoading(false);
      }
    }

    loadChapter();
  }, [chapterId]);

  useEffect(() => {
    if (!chapter) return;

    const changed =
      name !== chapter.name ||
      chapterNumber !== chapter.chapterNumber ||
      content !== chapter.content ||
      difficulty !== chapter.difficulty;

    setHasChanges(changed);
  }, [name, chapterNumber, content, difficulty, chapter]);

  const handleSave = async () => {
    if (!chapter) return;

    if (!name.trim()) {
      toast.error('Please enter a chapter name');
      return;
    }

    setSaving(true);
    try {
      const updated = await chapterService.update(chapter.id, {
        name: name.trim(),
        chapterNumber,
        content,
        difficulty,
      });
      setChapter(updated);
      setHasChanges(false);
      toast.success('Chapter saved');
    } catch (error) {
      console.error('Failed to save chapter:', error);
      toast.error('Failed to save chapter');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!chapter) return;

    setDeleting(true);
    try {
      await deleteChapter(chapter.id);
      toast.success('Chapter deleted');
      router.push('/content');
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      toast.error('Failed to delete chapter');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/content');
      }
    } else {
      router.push('/content');
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-7 w-48 bg-gray-200 animate-pulse rounded" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 animate-pulse rounded" />
              <div className="h-64 bg-gray-200 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/content')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Chapter Not Found</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">This chapter does not exist or was deleted.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/content')}>
              Back to Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SourceIcon = chapter.sourceType === 'pdf' ? FileText : Image;

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{chapter.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <SourceIcon className="h-3 w-3" />
              <span>
                {chapter.pageCount} {chapter.pageCount === 1 ? 'page' : 'pages'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chapter Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter chapter name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Number</Label>
                  <Input
                    id="number"
                    type="number"
                    min={1}
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={difficulty || 'none'}
                    onValueChange={(v) => setDifficulty(v === 'none' ? null : (v as Difficulty))}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Set difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ContentViewer content={content} onChange={setContent} />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{chapter.name}&quot;? This action cannot be
              undone.
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
    </div>
  );
}
