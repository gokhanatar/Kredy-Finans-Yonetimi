import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

const CLOUD_DIRTY = 'cloud-dirty';
const DEBOUNCE_MS = 30_000;

interface AutoCloudSyncUser {
  uid: string;
}

interface UseAutoCloudSyncOptions {
  user: AutoCloudSyncUser | null;
  enabled: boolean;
  onSyncStart?: () => void;
  onSyncEnd?: (lastBackup: string | null) => void;
  onSyncError?: (error: string) => void;
  onRestoreComplete?: () => void;
}

export function useAutoCloudSync({
  user,
  enabled,
  onSyncStart,
  onSyncEnd,
  onSyncError,
  onRestoreComplete,
}: UseAutoCloudSyncOptions) {
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInProgressRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const flushBackup = useCallback(async () => {
    if (!userRef.current || !dirtyRef.current || syncInProgressRef.current || !enabledRef.current) return;

    syncInProgressRef.current = true;
    dirtyRef.current = false;
    onSyncStart?.();

    try {
      const { saveToCloud, setLocalTimestamp } = await import('@/lib/cloudBackup');
      await saveToCloud(userRef.current.uid);
      const ts = new Date().toISOString();
      setLocalTimestamp(ts);
      onSyncEnd?.(ts);
    } catch (err) {
      dirtyRef.current = true;
      const message = err instanceof Error ? err.message : 'Otomatik yedekleme başarısız';
      onSyncError?.(message);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [onSyncStart, onSyncEnd, onSyncError]);

  const checkAndRestore = useCallback(async () => {
    if (!userRef.current || syncInProgressRef.current || !enabledRef.current) return;

    syncInProgressRef.current = true;
    onSyncStart?.();

    try {
      const {
        getBackupTimestamp,
        loadFromCloud,
        restoreLocalData,
        getLocalTimestamp,
        setLocalTimestamp,
        saveToCloud,
        collectLocalData,
      } = await import('@/lib/cloudBackup');

      const cloudTs = await getBackupTimestamp(userRef.current.uid);
      const localTs = getLocalTimestamp();

      const localData = collectLocalData();
      const hasLocalData = Object.values(localData.data).some(v => v !== null);

      if (!cloudTs && hasLocalData) {
        // No cloud backup, local has data → backup
        await saveToCloud(userRef.current.uid);
        const ts = new Date().toISOString();
        setLocalTimestamp(ts);
        onSyncEnd?.(ts);
      } else if (cloudTs && !hasLocalData) {
        // Cloud exists, no local data (fresh install) → restore
        const backup = await loadFromCloud(userRef.current.uid);
        if (backup) {
          restoreLocalData(backup);
          onSyncEnd?.(backup.timestamp);
          onRestoreComplete?.();
        } else {
          onSyncEnd?.(null);
        }
      } else if (cloudTs && localTs) {
        const cloudDate = new Date(cloudTs).getTime();
        const localDate = new Date(localTs).getTime();

        if (cloudDate > localDate) {
          // Cloud newer → restore
          const backup = await loadFromCloud(userRef.current.uid);
          if (backup) {
            restoreLocalData(backup);
            onSyncEnd?.(backup.timestamp);
            onRestoreComplete?.();
          } else {
            onSyncEnd?.(cloudTs);
          }
        } else if (localDate > cloudDate) {
          // Local newer → backup
          await saveToCloud(userRef.current.uid);
          const ts = new Date().toISOString();
          setLocalTimestamp(ts);
          onSyncEnd?.(ts);
        } else {
          // Same → no-op
          onSyncEnd?.(cloudTs);
        }
      } else if (cloudTs && !localTs) {
        // Cloud exists but no local timestamp (first auto-sync for existing user) → backup local
        await saveToCloud(userRef.current.uid);
        const ts = new Date().toISOString();
        setLocalTimestamp(ts);
        onSyncEnd?.(ts);
      } else {
        onSyncEnd?.(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Otomatik senkronizasyon başarısız';
      onSyncError?.(message);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [onSyncStart, onSyncEnd, onSyncError, onRestoreComplete]);

  // Listen for cloud-dirty events with debounce
  useEffect(() => {
    if (!user || !enabled) return;

    let allKeys: string[] | null = null;

    const handleDirty = async (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;

      if (!allKeys) {
        const mod = await import('@/lib/cloudBackup');
        allKeys = mod.ALL_STORAGE_KEYS;
      }
      if (!allKeys.includes(key)) return;

      dirtyRef.current = true;

      const { setLocalTimestamp } = await import('@/lib/cloudBackup');
      setLocalTimestamp();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushBackup, DEBOUNCE_MS);
    };

    window.addEventListener(CLOUD_DIRTY, handleDirty);
    return () => {
      window.removeEventListener(CLOUD_DIRTY, handleDirty);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, enabled, flushBackup]);

  // App lifecycle (Capacitor)
  useEffect(() => {
    if (!user || !enabled) return;
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => void } | null = null;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const l = await App.addListener('appStateChange', async ({ isActive }) => {
          if (!isActive) {
            if (dirtyRef.current && userRef.current) {
              if (timerRef.current) clearTimeout(timerRef.current);
              await flushBackup();
            }
          }
        });
        listener = l;
      } catch { /* web — no Capacitor */ }
    })();

    return () => { listener?.remove(); };
  }, [user, enabled, flushBackup]);

  // Initial sync on login / app launch
  const hasRunInitialSync = useRef(false);

  useEffect(() => {
    if (!user || !enabled) {
      hasRunInitialSync.current = false;
      return;
    }
    if (hasRunInitialSync.current) return;
    hasRunInitialSync.current = true;

    const timer = setTimeout(() => {
      checkAndRestore();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, enabled, checkAndRestore]);

  return { flushBackup, checkAndRestore };
}
