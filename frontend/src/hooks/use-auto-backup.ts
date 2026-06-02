'use client';

import { useEffect, useRef } from 'react';
import { driveService } from '@/services/drive-service';
import { getLastDataChangeTime } from '@/lib/db/database';

const AUTO_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useAutoBackup() {
  const lastBackupChangeTime = useRef(0);
  const backingUp = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (backingUp.current) return;

      const auth = driveService.getAuthState();
      if (!auth.isAuthenticated) return;

      const lastChange = getLastDataChangeTime();
      if (lastChange === 0 || lastChange <= lastBackupChangeTime.current) return;

      backingUp.current = true;
      try {
        await driveService.uploadBackup();
        lastBackupChangeTime.current = lastChange;
        const deleted = await driveService.cleanupOldBackups();
        console.log(`[auto-backup] Backed up to Google Drive${deleted ? `, cleaned up ${deleted} old backups` : ''}`);
      } catch (e) {
        console.error('[auto-backup] Failed:', e);
      } finally {
        backingUp.current = false;
      }
    }, AUTO_BACKUP_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
