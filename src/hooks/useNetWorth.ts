import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { NetWorthSnapshot, FAMILY_STORAGE_KEYS } from '@/types/familyFinance';

interface NetWorthSources {
  accountsTotal: number;
  assetsTotal: number;
  goalsTotal: number;
  creditCardDebt: number;
  loansDebt: number;
}

export function useNetWorth(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [history, setHistory] = useStorageForScope<NetWorthSnapshot[]>(
    storageKey || FAMILY_STORAGE_KEYS.NETWORTH_HISTORY,
    [],
    scope
  );

  const recordSnapshot = useCallback((sources: NetWorthSources) => {
    const totalAssets = sources.accountsTotal + sources.assetsTotal + sources.goalsTotal;
    const totalLiabilities = sources.creditCardDebt + sources.loansDebt;
    const netWorth = totalAssets - totalLiabilities;

    const snapshot: NetWorthSnapshot = {
      date: new Date().toISOString(),
      totalAssets,
      totalLiabilities,
      netWorth,
    };

    setHistory((prev) => {
      // Keep max 365 snapshots (one per day for a year)
      const updated = [...prev, snapshot];
      if (updated.length > 365) {
        return updated.slice(updated.length - 365);
      }
      return updated;
    });

    return snapshot;
  }, [setHistory]);

  const latestSnapshot = useMemo(() => {
    if (history.length === 0) return null;
    return history[history.length - 1];
  }, [history]);

  const monthlySnapshots = useMemo(() => {
    const map = new Map<string, NetWorthSnapshot>();
    history.forEach((s) => {
      const key = s.date.substring(0, 7); // YYYY-MM
      map.set(key, s); // Keep last snapshot per month
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [history]);

  const trend = useMemo(() => {
    if (monthlySnapshots.length < 2) return 0;
    const last = monthlySnapshots[monthlySnapshots.length - 1];
    const prev = monthlySnapshots[monthlySnapshots.length - 2];
    return last.netWorth - prev.netWorth;
  }, [monthlySnapshots]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return {
    history,
    recordSnapshot,
    latestSnapshot,
    monthlySnapshots,
    trend,
    clearHistory,
  };
}
