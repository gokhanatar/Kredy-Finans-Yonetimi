import { useLocalStorage } from './useLocalStorage';
import { useFamilySyncedStorage } from './useFamilySyncedStorage';

/**
 * Scope-aware storage hook that accepts raw storage keys.
 * 'personal' → useLocalStorage (no Firebase sync)
 * 'family'   → useFamilySyncedStorage (syncs via Firebase when connected)
 *
 * Both hooks are called unconditionally to satisfy React rules of hooks.
 */
export function useStorageForScope<T>(
  key: string,
  initialValue: T,
  scope: 'personal' | 'family' = 'personal'
): [T, (value: T | ((prev: T) => T)) => void] {
  const local = useLocalStorage<T>(key, initialValue);
  const synced = useFamilySyncedStorage<T>(key, initialValue);
  return scope === 'family' ? synced : local;
}
