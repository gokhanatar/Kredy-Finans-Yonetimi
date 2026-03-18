import { useState, useCallback, useEffect, useRef } from "react";

// Custom event for same-tab synchronization between hook instances
const LS_SYNC = 'ls-sync';

interface LSSyncDetail {
  key: string;
  value: string | null;
}

function emitSync(key: string, value: string | null) {
  window.dispatchEvent(
    new CustomEvent<LSSyncDetail>(LS_SYNC, { detail: { key, value } })
  );
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const initialValueRef = useRef(initialValue);
  const selfWrite = useRef(0);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValueRef.current;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prevValue) => {
      try {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== "undefined") {
          const serialized = JSON.stringify(valueToStore);
          selfWrite.current += 1;
          window.localStorage.setItem(key, serialized);
          emitSync(key, serialized);
          window.dispatchEvent(new CustomEvent('cloud-dirty', { detail: { key } }));
        }
        return valueToStore;
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
        return prevValue;
      }
    });
  }, [key]);

  // Sync from other hook instances (same tab) and other tabs
  useEffect(() => {
    const onSync = (e: Event) => {
      const { key: k, value: v } = (e as CustomEvent<LSSyncDetail>).detail;
      if (k !== key) return;
      if (selfWrite.current > 0) { selfWrite.current -= 1; return; }
      try {
        setStoredValue(v ? (JSON.parse(v) as T) : initialValueRef.current);
      } catch { /* ignore */ }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        setStoredValue(e.newValue ? (JSON.parse(e.newValue) as T) : initialValueRef.current);
      } catch { /* ignore */ }
    };

    window.addEventListener(LS_SYNC, onSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LS_SYNC, onSync);
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  return [storedValue, setValue];
}
