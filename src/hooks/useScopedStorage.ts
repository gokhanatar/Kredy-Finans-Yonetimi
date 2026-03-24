import { useLocalStorage } from './useLocalStorage';
import { useFamilySyncedStorage } from './useFamilySyncedStorage';

/**
 * Scope-aware storage hook.
 * 'personal' → useLocalStorage (never synced to Firebase)
 * 'family' → useFamilySyncedStorage (synced via Firebase when family is connected)
 */
export function useScopedStorage<T>(
  dataType: string,
  scope: 'personal' | 'family',
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const personalKey = `kredi-pusula-personal-${dataType}`;
  const familyKey = `kredi-pusula-family-${dataType}`;

  // Hooks must be called unconditionally (React rules of hooks)
  const personalResult = useLocalStorage<T>(personalKey, defaultValue);
  const familyResult = useFamilySyncedStorage<T>(familyKey, defaultValue);

  return scope === 'personal' ? personalResult : familyResult;
}
