'use client';

import { useEffect, useRef } from 'react';
import { driveService } from '@/services/drive-service';
import { getLastDataChangeTime } from '@/lib/db/database';

const AUTO_BACKUP_INTERVAL = 5 * 60 * 1000;
const LOCK_KEY = 'auto-backup-last-run';
const MIN_GAP = 4 * 60 * 1000;

export function useAutoBackup() {
  const backingUp = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (backingUp.current) return;
      if (!driveService.isConfigured() || !driveService.wasPreviouslyConnected()) return;

      const lastChange = getLastDataChangeTime();
      if (lastChange === 0) return;

      const lastRun = parseInt(localStorage.getItem(LOCK_KEY) || '0', 10);
      if (Date.now() - lastRun < MIN_GAP) return;
      if (lastChange <= lastRun) return;

      // If token expired, try silent refresh before giving up
      let auth = driveService.getAuthState();
      if (!auth.isAuthenticated) {
        const refreshed = await driveService.silentRefresh();
        if (!refreshed) return;
        auth = driveService.getAuthState();
        if (!auth.isAuthenticated) return;
      }

      backingUp.current = true;
      localStorage.setItem(LOCK_KEY, String(Date.now()));
      try {
        await driveService.uploadBackup();
        const deleted = await driveService.cleanupOldBackups();
        console.log(`[auto-backup] Done${deleted ? `, cleaned up ${deleted} old` : ''}`);
      } catch (e) {
        console.error('[auto-backup] Failed:', e);
      } finally {
        backingUp.current = false;
      }
    }, AUTO_BACKUP_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
