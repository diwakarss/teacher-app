'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/app-store';
import { useClassStore } from '@/stores/class-store';
import { initializeDb } from '@/lib/db/database';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeClassId, setActiveClass } = useAppStore();
  const { classes, loadClasses } = useClassStore();

  useEffect(() => {
    initializeDb().then(() => loadClasses());
  }, [loadClasses]);

  // Auto-select first class if none selected and classes exist
  useEffect(() => {
    if (!activeClassId && classes.length > 0) {
      setActiveClass(classes[0].id);
    }
  }, [activeClassId, classes, setActiveClass]);

  const handleClassChange = (value: string) => {
    setActiveClass(value || null);
    // If we're on a class detail page, navigate to the new class
    if (pathname.startsWith('/classes/') && value) {
      router.push(`/classes/${value}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-gray-900">Teacher Assistant</span>
        </div>

        {classes.length > 0 && (
          <Select
            value={activeClassId || ''}
            onValueChange={handleClassChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </header>
  );
}
