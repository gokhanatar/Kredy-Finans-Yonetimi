import { useState, useCallback, useRef, useEffect } from 'react';
import { useFamilySync } from '@/contexts/FamilySyncContext';

/**
 * Like useLocalStorage, but also syncs with Firebase when family sharing is active.
 * Local writes → localStorage + Firebase (REST).
 * Firebase changes → REST polling + SDK listener (fallback).
 */
export function useFamilySyncedStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const initialValueRef = useRef(initialValue);
  const { isConnected, syncData, onDataChange, fetchData, memberId, reportSyncError } = useFamilySync();
  const lastUpdatedAtRef = useRef<number>(0);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValueRef.current;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  });

  // Helper: apply remote data to local state
  const applyRemoteData = useCallback((data: unknown, updatedBy?: string, updatedAt?: number) => {
    // Ignore our own writes
    if (updatedBy && updatedBy === memberId) {
      console.log(`[FamilySync] Kendi yazimiz, atlaniyor: key=${key}, updatedBy=${updatedBy}`);
      return;
    }
    if (data !== undefined && data !== null) {
      // Skip if we already have this version
      if (updatedAt && updatedAt <= lastUpdatedAtRef.current) {
        console.log(`[FamilySync] Eski versiyon, atlaniyor: key=${key}, updatedAt=${updatedAt}, lastKnown=${lastUpdatedAtRef.current}`);
        return;
      }
      if (updatedAt) lastUpdatedAtRef.current = updatedAt;
      const parsed = data as T;
      setStoredValue(parsed);
      try {
        window.localStorage.setItem(key, JSON.stringify(parsed));
      } catch { /* ignore */ }

      // Dispatch event for family activity notifications
      if (updatedBy) {
        console.log(`[FamilySync] EVENT DISPATCH: key=${key}, updatedBy=${updatedBy}, memberId=${memberId}`);
        window.dispatchEvent(new CustomEvent('family-remote-update', {
          detail: { key, updatedBy, data: parsed },
        }));
      } else {
        console.log(`[FamilySync] updatedBy yok, event atlanamaz: key=${key}`);
      }
    }
  }, [key, memberId]);

  // REST fetch on mount + periodic polling (reliable in WKWebView)
  useEffect(() => {
    if (!isConnected) return;

    let cancelled = false;

    const doFetch = async () => {
      try {
        const result = await fetchData(key);
        if (cancelled) return;
        if (result && result.value !== undefined && result.value !== null) {
          console.log(`[FamilySync] FETCH: key=${key}, updatedBy=${result.updatedBy}, updatedAt=${result.updatedAt}`);
          applyRemoteData(result.value, result.updatedBy, result.updatedAt);
        }
      } catch (err) {
        console.error(`[FamilySync] FETCH ERROR: key=${key}`, err);
      }
    };

    // Initial fetch
    doFetch();

    // Poll every 10 seconds for updates
    const interval = setInterval(doFetch, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isConnected, key, fetchData, applyRemoteData]);

  // Also keep SDK listener as fallback for instant updates (may work on some devices)
  useEffect(() => {
    if (!isConnected) return;

    const unsub = onDataChange(key, (data, updatedBy) => {
      applyRemoteData(data, updatedBy);
    });

    return unsub;
  }, [isConnected, key, onDataChange, applyRemoteData]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prevValue) => {
      try {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.dispatchEvent(new CustomEvent('cloud-dirty', { detail: { key } }));
        }
        // Sync to Firebase if connected
        if (isConnected) {
          lastUpdatedAtRef.current = Date.now();
          syncData(key, valueToStore).catch((err) => {
            console.error('Family sync failed for key:', key, err);
            reportSyncError(
              err instanceof Error ? err.message : 'Aile senkronizasyonu başarısız oldu.'
            );
          });
        }
        return valueToStore;
      } catch {
        return prevValue;
      }
    });
  }, [key, isConnected, syncData, reportSyncError]);

  return [storedValue, setValue];
}
