import { useEffect, useRef, useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const STORAGE_KEYS = {
  cards: 'kredi-pusula-cards',
  accounts: 'kredi-pusula-personal-accounts',
  goals: 'kredi-pusula-personal-goals',
  privacyMode: 'kredi-pusula-privacy-mode',
};

const DEBOUNCE_MS = 500;

interface WidgetCardData {
  id: string;
  bankName: string;
  lastFourDigits: string;
  limit: number;
  currentDebt: number;
  dueDate: number;
  color: string;
}

interface WidgetAccountData {
  id: string;
  name: string;
  balance: number;
  type: string;
  icon: string;
  bankName?: string;
}

interface WidgetGoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
}

interface WidgetPayload {
  cards: WidgetCardData[];
  accounts: WidgetAccountData[];
  goals: WidgetGoalData[];
  totalDebt: number;
  totalLimit: number;
  utilizationRate: number;
  privacyMode: boolean;
  updatedAt: string;
}

// Register plugin once at module level
const WidgetBridge = registerPlugin<{
  updateWidgetData(opts: { data: string }): Promise<{ success: boolean }>;
}>('WidgetBridge');

function buildWidgetPayload(): WidgetPayload {
  let cards: WidgetCardData[] = [];
  let accounts: WidgetAccountData[] = [];
  let goals: WidgetGoalData[] = [];
  let privacyMode = false;

  try {
    const cardsRaw = localStorage.getItem(STORAGE_KEYS.cards);
    if (cardsRaw) {
      const parsed = JSON.parse(cardsRaw);
      cards = (Array.isArray(parsed) ? parsed : []).map((c: any) => ({
        id: c.id || '',
        bankName: c.bankName || '',
        lastFourDigits: c.lastFourDigits || '',
        limit: Number(c.limit) || 0,
        currentDebt: Number(c.currentDebt) || 0,
        dueDate: Number(c.dueDate) || 1,
        color: c.color || '',
      }));
    }
  } catch { /* ignore */ }

  try {
    const accountsRaw = localStorage.getItem(STORAGE_KEYS.accounts);
    if (accountsRaw) {
      const parsed = JSON.parse(accountsRaw);
      accounts = (Array.isArray(parsed) ? parsed : []).map((a: any) => ({
        id: a.id || '',
        name: a.name || '',
        balance: Number(a.balance) || 0,
        type: a.type || 'bank',
        icon: a.icon || 'building-2',
        bankName: a.bankName,
      }));
    }
  } catch { /* ignore */ }

  try {
    const goalsRaw = localStorage.getItem(STORAGE_KEYS.goals);
    if (goalsRaw) {
      const parsed = JSON.parse(goalsRaw);
      goals = (Array.isArray(parsed) ? parsed : []).map((g: any) => ({
        id: g.id || '',
        name: g.name || '',
        targetAmount: Number(g.targetAmount) || 0,
        currentAmount: Number(g.currentAmount) || 0,
        icon: g.icon || 'target',
      }));
    }
  } catch { /* ignore */ }

  try {
    privacyMode = localStorage.getItem(STORAGE_KEYS.privacyMode) === 'true';
  } catch { /* ignore */ }

  const totalDebt = cards.reduce((sum, c) => sum + c.currentDebt, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const utilizationRate = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;

  return {
    cards,
    accounts,
    goals,
    totalDebt,
    totalLimit,
    utilizationRate,
    privacyMode,
    updatedAt: new Date().toISOString(),
  };
}

export function useWidgetSync() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const syncToWidget = useCallback(async () => {
    if (!isNative) return;

    try {
      const payload = buildWidgetPayload();
      await WidgetBridge.updateWidgetData({ data: JSON.stringify(payload) });
    } catch {
      // Not available or failed — silent
    }
  }, [isNative]);

  const debouncedSync = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => syncToWidget(), DEBOUNCE_MS);
  }, [syncToWidget]);

  useEffect(() => {
    if (!isNative) return;

    // Initial sync on mount
    syncToWidget();

    const handleChange = () => debouncedSync();

    // ls-sync: useLocalStorage same-tab sync events
    // storage: cross-tab localStorage changes
    // cloud-dirty: useFamilySyncedStorage writes
    window.addEventListener('ls-sync', handleChange);
    window.addEventListener('storage', handleChange);
    window.addEventListener('cloud-dirty', handleChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('ls-sync', handleChange);
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('cloud-dirty', handleChange);
    };
  }, [isNative, syncToWidget, debouncedSync]);
}
