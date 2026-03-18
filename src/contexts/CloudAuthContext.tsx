import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  registerWithEmail,
  signOut as authSignOut,
  onAuthStateChange,
} from '@/lib/cloudAuth';
import { useAutoCloudSync } from '@/hooks/useAutoCloudSync';

const AUTO_SYNC_LS_KEY = 'kredi-pusula-auto-sync-enabled';

interface CloudAuthState {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  lastBackup: string | null;
  error: string | null;
  autoSyncEnabled: boolean;
}

interface CloudAuthContextType extends CloudAuthState {
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  backup: () => Promise<void>;
  restore: () => Promise<boolean>;
  setAutoSyncEnabled: (enabled: boolean) => void;
}

const CloudAuthContext = createContext<CloudAuthContextType | undefined>(undefined);

export function CloudAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CloudAuthState>({
    user: null,
    loading: true,
    syncing: false,
    lastBackup: null,
    error: null,
    autoSyncEnabled: (() => {
      try { return localStorage.getItem(AUTO_SYNC_LS_KEY) !== 'false'; } catch { return true; }
    })(),
  });

  const setAutoSyncEnabled = useCallback((enabled: boolean) => {
    setState((s) => ({ ...s, autoSyncEnabled: enabled }));
    try { localStorage.setItem(AUTO_SYNC_LS_KEY, String(enabled)); } catch { /* ignore */ }
  }, []);

  // Auto cloud sync hook
  useAutoCloudSync({
    user: state.user ? { uid: state.user.uid } : null,
    enabled: state.autoSyncEnabled,
    onSyncStart: useCallback(() => {
      setState((s) => ({ ...s, syncing: true, error: null }));
    }, []),
    onSyncEnd: useCallback((lastBackup: string | null) => {
      setState((s) => ({ ...s, syncing: false, lastBackup }));
    }, []),
    onSyncError: useCallback((error: string) => {
      setState((s) => ({ ...s, syncing: false, error }));
    }, []),
    onRestoreComplete: useCallback(() => {
      window.location.reload();
    }, []),
  });

  useEffect(() => {
    // Timeout to prevent infinite loading if Firebase fails to initialize
    const timeout = setTimeout(() => {
      setState((s) => {
        if (s.loading) return { ...s, loading: false };
        return s;
      });
    }, 5000);

    let unsub: (() => void) | undefined;
    try {
      unsub = onAuthStateChange(async (user) => {
        clearTimeout(timeout);
        if (user) {
          const { getBackupTimestamp } = await import('@/lib/cloudBackup');
          const ts = await getBackupTimestamp(user.uid).catch(() => null);
          setState((s) => ({ ...s, user, loading: false, lastBackup: ts }));
        } else {
          setState((s) => ({ ...s, user: null, loading: false, lastBackup: null }));
        }
      });
    } catch {
      clearTimeout(timeout);
      setState((s) => ({ ...s, loading: false }));
    }

    return () => {
      clearTimeout(timeout);
      unsub?.();
    };
  }, []);

  const handleAuth = useCallback(async (authFn: () => Promise<User>) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const user = await authFn();
      const { getBackupTimestamp } = await import('@/lib/cloudBackup');
      const ts = await getBackupTimestamp(user.uid).catch(() => null);
      setState((s) => ({ ...s, user, loading: false, lastBackup: ts }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Auth failed';
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(() => handleAuth(signInWithGoogle), [handleAuth]);
  const loginWithApple = useCallback(() => handleAuth(signInWithApple), [handleAuth]);
  const loginWithEmail = useCallback(
    (email: string, password: string) => handleAuth(() => signInWithEmail(email, password)),
    [handleAuth]
  );
  const registerEmail = useCallback(
    (email: string, password: string) => handleAuth(() => registerWithEmail(email, password)),
    [handleAuth]
  );

  const logout = useCallback(async () => {
    await authSignOut();
    setState((s) => ({ ...s, user: null, lastBackup: null }));
  }, []);

  const backup = useCallback(async () => {
    if (!state.user) return;
    setState((s) => ({ ...s, syncing: true, error: null }));
    try {
      const { saveToCloud, setLocalTimestamp } = await import('@/lib/cloudBackup');
      await saveToCloud(state.user.uid);
      const ts = new Date().toISOString();
      setLocalTimestamp(ts);
      setState((s) => ({
        ...s,
        syncing: false,
        lastBackup: ts,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      setState((s) => ({ ...s, syncing: false, error: message }));
      throw err;
    }
  }, [state.user]);

  const restore = useCallback(async (): Promise<boolean> => {
    if (!state.user) return false;
    setState((s) => ({ ...s, syncing: true, error: null }));
    try {
      const { loadFromCloud, restoreLocalData } = await import('@/lib/cloudBackup');
      const data = await loadFromCloud(state.user.uid);
      if (!data) {
        setState((s) => ({ ...s, syncing: false }));
        return false;
      }
      restoreLocalData(data);
      setState((s) => ({ ...s, syncing: false, lastBackup: data.timestamp }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Restore failed';
      setState((s) => ({ ...s, syncing: false, error: message }));
      throw err;
    }
  }, [state.user]);

  const value = useMemo(() => ({
    ...state,
    loginWithGoogle,
    loginWithApple,
    loginWithEmail,
    registerEmail,
    logout,
    backup,
    restore,
    setAutoSyncEnabled,
  }), [state, loginWithGoogle, loginWithApple, loginWithEmail, registerEmail, logout, backup, restore, setAutoSyncEnabled]);

  return (
    <CloudAuthContext.Provider value={value}>
      {children}
    </CloudAuthContext.Provider>
  );
}

export function useCloudAuth() {
  const context = useContext(CloudAuthContext);
  if (!context) {
    throw new Error('useCloudAuth must be used within a CloudAuthProvider');
  }
  return context;
}
