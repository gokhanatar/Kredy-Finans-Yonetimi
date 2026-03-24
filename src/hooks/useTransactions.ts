import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { useFamilySync } from '@/contexts/FamilySyncContext';
import {
  FamilyTransaction,
  FamilyTransactionCategory,
  FAMILY_STORAGE_KEYS,
  TransactionType,
} from '@/types/familyFinance';

export function useTransactions(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [transactions, setTransactions] = useStorageForScope<FamilyTransaction[]>(
    storageKey || FAMILY_STORAGE_KEYS.TRANSACTIONS,
    [],
    scope
  );
  const { memberId } = useFamilySync();

  const addTransaction = useCallback((data: Omit<FamilyTransaction, 'id'>) => {
    const newTx: FamilyTransaction = {
      ...data,
      id: crypto.randomUUID(),
      ...(scope === 'family' && memberId ? { createdBy: memberId } : {}),
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  }, [setTransactions, scope, memberId]);

  const updateTransaction = useCallback((id: string, updates: Partial<FamilyTransaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, [setTransactions]);

  const getByMonth = useCallback((month: number, year: number) => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [transactions]);

  const getByCategory = useCallback((category: FamilyTransactionCategory) => {
    return transactions.filter((t) => t.category === category);
  }, [transactions]);

  const getByType = useCallback((type: TransactionType) => {
    return transactions.filter((t) => t.type === type);
  }, [transactions]);

  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return { income, expense, net: income - expense };
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthExpenses = transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === month && d.getFullYear() === year;
    });

    const map = new Map<FamilyTransactionCategory, number>();
    monthExpenses.forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });

    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getByMonth,
    getByCategory,
    getByType,
    monthlyTotals,
    categoryBreakdown,
  };
}
