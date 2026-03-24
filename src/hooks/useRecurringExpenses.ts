import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { RecurringExpense, FAMILY_STORAGE_KEYS } from '@/types/familyFinance';

export function useRecurringExpenses(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [expenses, setExpenses] = useStorageForScope<RecurringExpense[]>(
    storageKey || FAMILY_STORAGE_KEYS.RECURRING_EXPENSES,
    [],
    scope
  );

  const addExpense = useCallback((data: Omit<RecurringExpense, 'id'>) => {
    const newExp: RecurringExpense = { ...data, id: crypto.randomUUID() };
    setExpenses((prev) => [...prev, newExp]);
    return newExp;
  }, [setExpenses]);

  const updateExpense = useCallback((id: string, updates: Partial<RecurringExpense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [setExpenses]);

  const toggleActive = useCallback((id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e))
    );
  }, [setExpenses]);

  const dailyCost = useMemo(() => {
    const today = new Date().getDay(); // 0=Sunday
    return expenses
      .filter((e) => e.isActive && e.activeDays.includes(today))
      .reduce((sum, e) => sum + e.dailyAmount, 0);
  }, [expenses]);

  const weeklyCost = useMemo(() => {
    return expenses
      .filter((e) => e.isActive)
      .reduce((sum, e) => sum + e.dailyAmount * e.activeDays.length, 0);
  }, [expenses]);

  const monthlyCost = useMemo(() => {
    return expenses
      .filter((e) => e.isActive)
      .reduce((sum, e) => {
        const daysPerMonth = (e.activeDays.length / 7) * 30.44;
        return sum + e.dailyAmount * daysPerMonth;
      }, 0);
  }, [expenses]);

  const getTodaysExpenses = useCallback(() => {
    const today = new Date().getDay();
    return expenses.filter((e) => e.isActive && e.activeDays.includes(today));
  }, [expenses]);

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleActive,
    dailyCost,
    weeklyCost,
    monthlyCost,
    getTodaysExpenses,
  };
}
