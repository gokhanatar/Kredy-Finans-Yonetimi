import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { RecurringBill, BillPayment, FAMILY_STORAGE_KEYS } from '@/types/familyFinance';

export function useRecurringBills(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [bills, setBills] = useStorageForScope<RecurringBill[]>(
    storageKey || FAMILY_STORAGE_KEYS.MONTHLY_BILLS,
    [],
    scope
  );

  const addBill = useCallback((data: Omit<RecurringBill, 'id'>) => {
    const newBill: RecurringBill = { ...data, id: crypto.randomUUID() };
    setBills((prev) => [...prev, newBill]);
    return newBill;
  }, [setBills]);

  const updateBill = useCallback((id: string, updates: Partial<RecurringBill>) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [setBills]);

  const deleteBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, [setBills]);

  const toggleActive = useCallback((id: string) => {
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  }, [setBills]);

  const recordPayment = useCallback((id: string, amount: number) => {
    const payment: BillPayment = {
      id: crypto.randomUUID(),
      amount,
      date: new Date().toISOString(),
      isPaid: true,
    };
    setBills((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, lastPaidAmount: amount, history: [...b.history, payment] }
          : b
      )
    );
  }, [setBills]);

  const monthlyCost = useMemo(() => {
    return bills
      .filter((b) => b.isActive)
      .reduce((sum, b) => {
        let cost = 0;
        if (b.isFixedAmount && b.fixedAmount) {
          cost = b.fixedAmount;
        } else if (!b.isFixedAmount && b.lastPaidAmount) {
          cost = b.lastPaidAmount;
        }
        // Adjust to monthly based on frequency
        switch (b.frequency) {
          case 'daily': return sum + cost * 30.44;
          case 'weekly': return sum + cost * 4.33;
          case 'monthly': return sum + cost;
          case 'yearly': return sum + cost / 12;
          default: return sum;
        }
      }, 0);
  }, [bills]);

  const activeCount = useMemo(() => bills.filter((b) => b.isActive).length, [bills]);

  return {
    bills,
    addBill,
    updateBill,
    deleteBill,
    toggleActive,
    recordPayment,
    monthlyCost,
    activeCount,
  };
}
