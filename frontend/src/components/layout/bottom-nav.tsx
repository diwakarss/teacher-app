'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ClipboardList, MessageSquare, BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/classes', label: 'Classes', icon: BookOpen },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/marks', label: 'Marks', icon: ClipboardList },
  { href: '/content', label: 'Content', icon: FileText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white pb-safe">
      <div className="flex h-16 items-center justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
