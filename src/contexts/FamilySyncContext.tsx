import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

function isFirebaseConfigured(): boolean {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return !!key && key !== 'placeholder';
}

const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

interface FamilyMember {
  name: string;
  joinedAt: number;
  lastSeen: number;
  role?: 'organizer' | 'member';
  isPremium?: boolean;
}

interface FamilySyncState {
  familyId: string | null;
  memberId: string | null;
  memberName: string;
  members: Record<string, FamilyMember>;
  isConnected: boolean;
  isConfigured: boolean;
  error: string | null;
  syncError: string | null;
}

interface FamilySyncContextType extends FamilySyncState {
  createFamily: (name: string) => Promise<string>;
  joinFamily: (code: string, name: string, isPremium?: boolean) => Promise<boolean>;
  leaveFamily: () => Promise<void>;
  syncData: (key: string, data: unknown) => Promise<void>;
  onDataChange: (key: string, callback: (data: unknown, updatedBy?: string) => void) => () => void;
  fetchData: (key: string) => Promise<{ value: unknown; updatedBy?: string; updatedAt?: number } | null>;
  reportSyncError: (error: string) => void;
  isOrganizer: boolean;
  memberRole: 'organizer' | 'member' | null;
  gracePeriodDaysLeft: number | null;
  isInGracePeriod: boolean;
}

const FamilySyncContext = createContext<FamilySyncContextType | undefined>(undefined);

const FAMILY_LS_KEY = 'kredi-pusula-family';
const FIREBASE_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    ),
  ]);
}

function generateFamilyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 12;
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[randomValues[i] % chars.length];
  }
  return code;
}

export function formatFamilyCode(code: string): string {
  const clean = code.replace(/[^A-Z0-9]/gi, '');
  return clean.match(/.{1,4}/g)?.join('-') || clean;
}

function generateMemberId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function loadStoredFamily(): { familyId: string; memberId: string; memberName: string } | null {
  try {
    const stored = localStorage.getItem(FAMILY_LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function saveStoredFamily(familyId: string, memberId: string, memberName: string) {
  localStorage.setItem(FAMILY_LS_KEY, JSON.stringify({ familyId, memberId, memberName }));
}

function clearStoredFamily() {
  localStorage.removeItem(FAMILY_LS_KEY);
}

// Lazy-load Firebase — SDK for real-time listeners, REST API for reads/writes
async function getFirebase() {
  const fb = await import('@/lib/firebase');
  const db = await fb.getFirebaseDatabase();
  return { db, fb };
}

async function getFirebaseRest() {
  const { restGet, restSet, restRemove } = await import('@/lib/firebase');
  return { restGet, restSet, restRemove };
}

export function FamilySyncProvider({ children }: { children: ReactNode }) {
  const { isPremium } = useSubscriptionContext();
  const [gracePeriodDaysLeft, setGracePeriodDaysLeft] = useState<number | null>(null);
  const [isInGracePeriod, setIsInGracePeriod] = useState(false);
  const [state, setState] = useState<FamilySyncState>({
    familyId: null,
    memberId: null,
    memberName: '',
    members: {},
    isConnected: false,
    isConfigured: isFirebaseConfigured(),
    error: null,
    syncError: null,
  });
  const unsubscribesRef = useRef<Array<() => void>>([]);
  const syncErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bug 3 fix: helper to clear all active listeners
  const clearListeners = useCallback(() => {
    unsubscribesRef.current.forEach((u) => u());
    unsubscribesRef.current = [];
  }, []);

  // Bug 5 fix: report sync errors with auto-clear
  const reportSyncError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, syncError: error }));
    if (syncErrorTimerRef.current) clearTimeout(syncErrorTimerRef.current);
    syncErrorTimerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, syncError: null }));
      syncErrorTimerRef.current = null;
    }, 5000);
  }, []);

  const currentMember = state.memberId ? state.members[state.memberId] : null;
  const memberRole = currentMember?.role || null;
  const isOrganizer = memberRole === 'organizer';

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const stored = loadStoredFamily();
    if (!stored) return;

    let cancelled = false;

    (async () => {
      try {
        const rest = await getFirebaseRest();
        if (cancelled) return;

        const familyData = await withTimeout(
          rest.restGet(`families/${stored.familyId}`) as Promise<Record<string, unknown> | null>,
          FIREBASE_TIMEOUT_MS,
          'Firebase connection timeout'
        );

        if (cancelled) return;

        if (familyData) {
          const members = familyData.members as Record<string, FamilyMember> | undefined;
          const existingMember = members?.[stored.memberId];
          await rest.restSet(`families/${stored.familyId}/members/${stored.memberId}`, {
            name: stored.memberName,
            joinedAt: existingMember?.joinedAt || Date.now(),
            lastSeen: Date.now(),
            role: existingMember?.role || 'member',
            isPremium: existingMember?.isPremium || false,
          });

          const { db, fb } = await getFirebase();

          setState((prev) => ({
            ...prev,
            familyId: stored.familyId,
            memberId: stored.memberId,
            memberName: stored.memberName,
            members: members || {},
            isConnected: true,
            error: null,
          }));

          const membersRef = await fb.ref(db, `families/${stored.familyId}/members`);
          const unsub = await fb.onValue(membersRef, (snap) => {
            if (!cancelled) {
              setState((prev) => ({
                ...prev,
                members: snap.val() || {},
              }));
            }
          });
          unsubscribesRef.current.push(unsub);
        } else {
          clearStoredFamily();
        }
      } catch (err) {
        console.error('Family reconnect failed:', err);
        if (!cancelled) {
          setState((prev) => ({ ...prev, error: 'Firebase bağlantı hatası.' }));
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribesRef.current.forEach((u) => u());
      unsubscribesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!state.isConnected || !state.familyId || !state.memberId) return;
    if (!isFirebaseConfigured()) return;

    const interval = setInterval(async () => {
      try {
        const rest = await getFirebaseRest();
        await rest.restSet(`families/${state.familyId}/members/${state.memberId}/lastSeen`, Date.now());
      } catch { /* ignore */ }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.isConnected, state.familyId, state.memberId]);

  // Grace period: when organizer loses PRO, start 3-day countdown
  useEffect(() => {
    if (!state.isConnected || !state.familyId || !isFirebaseConfigured()) return;
    if (!isOrganizer) return;

    let cancelled = false;

    (async () => {
      try {
        const rest = await getFirebaseRest();
        if (cancelled) return;

        const familyData = await rest.restGet(`families/${state.familyId}`) as Record<string, unknown> | null;
        if (cancelled || !familyData) return;

        const gracePeriodStartedAt = familyData.gracePeriodStartedAt as number | undefined;
        const dissolveScheduledAt = familyData.dissolveScheduledAt as number | undefined;

        if (!isPremium) {
          // PRO lost — start or check grace period
          if (!gracePeriodStartedAt) {
            // Start grace period
            const now = Date.now();
            await rest.restSet(`families/${state.familyId}/gracePeriodStartedAt`, now);
            await rest.restSet(`families/${state.familyId}/dissolveScheduledAt`, now + GRACE_PERIOD_MS);
            setGracePeriodDaysLeft(3);
            setIsInGracePeriod(true);
          } else if (dissolveScheduledAt) {
            const remaining = dissolveScheduledAt - Date.now();
            if (remaining <= 0) {
              // Grace period expired — dissolve the family
              if (!cancelled) {
                await rest.restRemove(`families/${state.familyId}`);
                clearListeners();
                clearStoredFamily();
                setState((prev) => ({
                  ...prev,
                  familyId: null,
                  memberId: null,
                  memberName: '',
                  members: {},
                  isConnected: false,
                  error: null,
                  syncError: null,
                }));
                setGracePeriodDaysLeft(null);
                setIsInGracePeriod(false);
              }
            } else {
              const daysLeft = Math.ceil(remaining / (24 * 60 * 60 * 1000));
              setGracePeriodDaysLeft(daysLeft);
              setIsInGracePeriod(true);
            }
          }
        } else {
          // PRO restored — clear grace period
          if (gracePeriodStartedAt) {
            await rest.restRemove(`families/${state.familyId}/gracePeriodStartedAt`);
            await rest.restRemove(`families/${state.familyId}/dissolveScheduledAt`);
          }
          setGracePeriodDaysLeft(null);
          setIsInGracePeriod(false);
        }
      } catch (err) {
        console.error('Grace period check failed:', err);
      }
    })();

    // Check periodically (every 1 hour)
    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const rest = await getFirebaseRest();
        const familyData = await rest.restGet(`families/${state.familyId}`) as Record<string, unknown> | null;
        if (!familyData || cancelled) return;

        const dissolveScheduledAt = familyData.dissolveScheduledAt as number | undefined;
        if (dissolveScheduledAt && !isPremium) {
          const remaining = dissolveScheduledAt - Date.now();
          if (remaining <= 0 && !cancelled) {
            await rest.restRemove(`families/${state.familyId}`);
            clearListeners();
            clearStoredFamily();
            setState((prev) => ({
              ...prev,
              familyId: null,
              memberId: null,
              memberName: '',
              members: {},
              isConnected: false,
              error: null,
              syncError: null,
            }));
            setGracePeriodDaysLeft(null);
            setIsInGracePeriod(false);
          } else if (remaining > 0) {
            setGracePeriodDaysLeft(Math.ceil(remaining / (24 * 60 * 60 * 1000)));
          }
        }
      } catch { /* ignore */ }
    }, 60 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [state.isConnected, state.familyId, isPremium, isOrganizer, clearListeners]);

  // Bug 4 fix: retry count parameter with max 3 attempts
  const createFamily = useCallback(async (name: string, _retryCount = 0): Promise<string> => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');

    let rest;
    try {
      rest = await getFirebaseRest();
    } catch (err) {
      throw new Error('Firebase SDK yüklenemedi. İnternet bağlantınızı kontrol edin.');
    }

    const code = generateFamilyCode();
    const memberId = generateMemberId();

    let existingData;
    try {
      existingData = await withTimeout(
        rest.restGet(`families/${code}`),
        FIREBASE_TIMEOUT_MS,
        'Firebase bağlantı zaman aşımı. İnternet bağlantınızı kontrol edin.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        throw new Error('Firebase veritabanı erişim izni reddedildi. Veritabanı güvenlik kurallarını kontrol edin.');
      }
      throw err;
    }
    if (existingData !== null) {
      if (_retryCount >= 3) {
        throw new Error('Aile kodu oluşturulamadı. Lütfen tekrar deneyin.');
      }
      return createFamily(name, _retryCount + 1);
    }

    const member: FamilyMember = {
      name,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      role: 'organizer',
      isPremium,
    };

    try {
      await withTimeout(
        rest.restSet(`families/${code}`, {
          createdAt: Date.now(),
          createdBy: memberId,
          members: { [memberId]: member },
        }),
        FIREBASE_TIMEOUT_MS,
        'Firebase yazma zaman aşımı.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        throw new Error('Firebase veritabanı yazma izni reddedildi. Veritabanı güvenlik kurallarını kontrol edin.');
      }
      throw err;
    }

    saveStoredFamily(code, memberId, name);

    // Bug 3 fix: clear existing listeners before registering new ones
    clearListeners();

    // SDK only for real-time listener
    const { db, fb } = await getFirebase();
    const membersRef = await fb.ref(db, `families/${code}/members`);
    const unsub = await fb.onValue(membersRef, (snap) => {
      setState((prev) => ({
        ...prev,
        members: snap.val() || {},
      }));
    });
    unsubscribesRef.current.push(unsub);

    setState((prev) => ({
      ...prev,
      familyId: code,
      memberId,
      memberName: name,
      members: { [memberId]: member },
      isConnected: true,
      error: null,
    }));

    return code;
  }, [clearListeners, isPremium]);

  const joinFamily = useCallback(async (code: string, name: string, isPremium = false): Promise<boolean> => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');

    const rest = await getFirebaseRest();
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

    let familyData;
    try {
      familyData = await withTimeout(
        rest.restGet(`families/${normalizedCode}`),
        FIREBASE_TIMEOUT_MS,
        'Firebase bağlantı zaman aşımı. İnternet bağlantınızı kontrol edin.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        throw new Error('Firebase veritabanı erişim izni reddedildi. Veritabanı güvenlik kurallarını kontrol edin.');
      }
      throw err;
    }
    if (familyData === null) {
      setState((prev) => ({ ...prev, error: 'Family group not found' }));
      return false;
    }

    // PRO members can join unlimited — only free members are limited (max 1)
    const existingMembers = (familyData as Record<string, unknown>).members as Record<string, FamilyMember> | undefined;
    if (!isPremium && existingMembers) {
      const freeMemberCount = Object.values(existingMembers).filter(
        (m) => !m.isPremium && m.role !== 'organizer'
      ).length;
      if (freeMemberCount >= 1) {
        setState((prev) => ({ ...prev, error: 'Free member limit reached' }));
        return false;
      }
    }

    const memberId = generateMemberId();
    const member: FamilyMember = {
      name,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      role: 'member',
      isPremium,
    };

    try {
      await withTimeout(
        rest.restSet(`families/${normalizedCode}/members/${memberId}`, member),
        FIREBASE_TIMEOUT_MS,
        'Firebase yazma zaman aşımı.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        throw new Error('Firebase veritabanı yazma izni reddedildi. Veritabanı güvenlik kurallarını kontrol edin.');
      }
      throw err;
    }

    saveStoredFamily(normalizedCode, memberId, name);

    // Bug 3 fix: clear existing listeners before registering new ones
    clearListeners();

    // SDK only for real-time listener
    const { db, fb } = await getFirebase();
    const membersRef = await fb.ref(db, `families/${normalizedCode}/members`);
    const unsub = await fb.onValue(membersRef, (snap) => {
      setState((prev) => ({
        ...prev,
        members: snap.val() || {},
      }));
    });
    unsubscribesRef.current.push(unsub);

    // Immediately set members (existing + self) so UI doesn't show 0
    const allMembers = { ...(existingMembers || {}), [memberId]: member };
    setState((prev) => ({
      ...prev,
      familyId: normalizedCode,
      memberId,
      memberName: name,
      members: allMembers,
      isConnected: true,
      error: null,
    }));

    return true;
  }, [clearListeners]);

  const leaveFamily = useCallback(async () => {
    if (!state.familyId || !state.memberId) return;
    if (!isFirebaseConfigured()) return;

    try {
      const rest = await getFirebaseRest();
      await rest.restRemove(`families/${state.familyId}/members/${state.memberId}`);
    } catch (err) {
      console.warn('Failed to remove member from Firebase family. Member entry may persist:', err);
    }

    clearListeners();
    clearStoredFamily();

    setState((prev) => ({
      ...prev,
      familyId: null,
      memberId: null,
      memberName: '',
      members: {},
      isConnected: false,
      error: null,
      syncError: null,
    }));
  }, [state.familyId, state.memberId, clearListeners]);

  // Bug 6 fix: add timeout to syncData — uses REST API
  const syncData = useCallback(async (key: string, data: unknown) => {
    if (!state.familyId || !isFirebaseConfigured()) return;

    const rest = await getFirebaseRest();
    const path = `families/${state.familyId}/data/${key}`;

    // value null/undefined ise Firebase validate başarısız olur (hasChildren(['value',...]))
    if (data === null || data === undefined) {
      await withTimeout(rest.restRemove(path), FIREBASE_TIMEOUT_MS, 'Senkronizasyon zaman aşımı.');
      return;
    }

    await withTimeout(
      rest.restSet(path, {
        value: data,
        updatedBy: state.memberId,
        updatedAt: Date.now(),
      }),
      FIREBASE_TIMEOUT_MS,
      'Senkronizasyon zaman aşımı.'
    );
  }, [state.familyId, state.memberId]);

  // REST-based data fetch — reliable in WKWebView (no WebSocket dependency)
  const fetchData = useCallback(async (key: string): Promise<{ value: unknown; updatedBy?: string; updatedAt?: number } | null> => {
    if (!state.familyId || !isFirebaseConfigured()) return null;

    const rest = await getFirebaseRest();
    const path = `families/${state.familyId}/data/${key}`;
    const result = await withTimeout(
      rest.restGet(path) as Promise<Record<string, unknown> | null>,
      FIREBASE_TIMEOUT_MS,
      'Veri çekme zaman aşımı.'
    );
    if (result && result.value !== undefined) {
      return {
        value: result.value,
        updatedBy: result.updatedBy as string | undefined,
        updatedAt: result.updatedAt as number | undefined,
      };
    }
    return null;
  }, [state.familyId]);

  // Bug 1 fix: pass updatedBy to callback for identity-based filtering
  const onDataChange = useCallback((key: string, callback: (data: unknown, updatedBy?: string) => void): (() => void) => {
    if (!state.familyId || !isFirebaseConfigured()) {
      return () => {};
    }

    let unsub: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { db, fb } = await getFirebase();
        if (cancelled) return;
        const dataRef = await fb.ref(db, `families/${state.familyId}/data/${key}`);
        if (cancelled) return;
        const listener = await fb.onValue(dataRef, (snapshot) => {
          if (cancelled) return;
          const val = snapshot.val();
          if (val?.value !== undefined) {
            callback(val.value, val.updatedBy);
          }
        });
        if (!cancelled) {
          unsub = listener;
          unsubscribesRef.current.push(listener);
        } else {
          listener();
        }
      } catch (err) {
        // Bug 2 fix: log instead of silently ignoring
        console.error('Family sync listener setup failed:', key, err);
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [state.familyId]);

  return (
    <FamilySyncContext.Provider
      value={{
        ...state,
        createFamily,
        joinFamily,
        leaveFamily,
        syncData,
        onDataChange,
        fetchData,
        reportSyncError,
        isOrganizer,
        memberRole,
        gracePeriodDaysLeft,
        isInGracePeriod,
      }}
    >
      {children}
    </FamilySyncContext.Provider>
  );
}

export function useFamilySync() {
  const context = useContext(FamilySyncContext);
  if (context === undefined) {
    throw new Error('useFamilySync must be used within a FamilySyncProvider');
  }
  return context;
}
