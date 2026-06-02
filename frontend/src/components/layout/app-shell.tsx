'use client';

import { ReactNode } from 'react';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import { OfflineIndicator } from './offline-indicator';
import { useAutoBackup } from '@/hooks/use-auto-backup';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useAutoBackup();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <OfflineIndicator />
      <Header />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
