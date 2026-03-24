import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { Subscription, FAMILY_STORAGE_KEYS } from '@/types/familyFinance';

function getNextBillingDate(billingDate: number, cycle: Subscription['billingCycle']): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = Math.min(billingDate, new Date(year, month + 1, 0).getDate());

  const next = new Date(year, month, day);
  if (next <= now) {
    if (cycle === 'weekly') {
      while (next <= now) {
        next.setDate(next.getDate() + 7);
      }
    } else if (cycle === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setFullYear(next.getFullYear() + 1);
    }
  }
  return next;
}

export function useSubscriptions(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [subscriptions, setSubscriptions] = useStorageForScope<Subscription[]>(
    storageKey || FAMILY_STORAGE_KEYS.SUBSCRIPTIONS,
    [],
    scope
  );

  const addSubscription = useCallback((data: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = { ...data, id: crypto.randomUUID() };
    setSubscriptions((prev) => [...prev, newSub]);
    return newSub;
  }, [setSubscriptions]);

  const updateSubscription = useCallback((id: string, updates: Partial<Subscription>) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, [setSubscriptions]);

  const deleteSubscription = useCallback((id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  }, [setSubscriptions]);

  const toggleActive = useCallback((id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  }, [setSubscriptions]);

  const monthlyCost = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => {
        switch (s.billingCycle) {
          case 'weekly': return sum + s.amount * 4.33;
          case 'monthly': return sum + s.amount;
          case 'yearly': return sum + s.amount / 12;
          default: return sum;
        }
      }, 0);
  }, [subscriptions]);

  const yearlyCost = useMemo(() => monthlyCost * 12, [monthlyCost]);

  const upcomingBills = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive)
      .map((s) => ({
        ...s,
        nextBillingDate: getNextBillingDate(s.billingDate, s.billingCycle),
      }))
      .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());
  }, [subscriptions]);

  const activeCount = useMemo(() => subscriptions.filter((s) => s.isActive).length, [subscriptions]);

  return {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleActive,
    monthlyCost,
    yearlyCost,
    upcomingBills,
    activeCount,
  };
}
