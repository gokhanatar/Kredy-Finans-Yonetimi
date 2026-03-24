import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { Budget, BudgetCategory, FAMILY_STORAGE_KEYS, DEFAULT_BUDGET_CATEGORIES } from '@/types/familyFinance';

export function useBudget(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [budgets, setBudgets] = useStorageForScope<Budget[]>(storageKey || FAMILY_STORAGE_KEYS.BUDGETS, [], scope);

  const getCurrentBudget = useCallback(() => {
    const now = new Date();
    return budgets.find((b) => b.month === now.getMonth() && b.year === now.getFullYear());
  }, [budgets]);

  const createBudget = useCallback((month: number, year: number, totalIncome: number) => {
    const existing = budgets.find((b) => b.month === month && b.year === year);
    if (existing) return existing;

    const newBudget: Budget = {
      id: crypto.randomUUID(),
      month,
      year,
      totalIncome,
      categories: DEFAULT_BUDGET_CATEGORIES.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        allocated: 0,
        spent: 0,
      })),
    };
    setBudgets((prev) => [...prev, newBudget]);
    return newBudget;
  }, [budgets, setBudgets]);

  const updateBudgetIncome = useCallback((budgetId: string, totalIncome: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, totalIncome } : b))
    );
  }, [setBudgets]);

  const updateCategoryAllocation = useCallback(
    (budgetId: string, categoryId: string, allocated: number) => {
      setBudgets((prev) =>
        prev.map((b) => {
          if (b.id !== budgetId) return b;
          return {
            ...b,
            categories: b.categories.map((c) =>
              c.id === categoryId ? { ...c, allocated } : c
            ),
          };
        })
      );
    },
    [setBudgets]
  );

  const updateCategorySpent = useCallback(
    (budgetId: string, categoryId: string, spent: number) => {
      setBudgets((prev) =>
        prev.map((b) => {
          if (b.id !== budgetId) return b;
          return {
            ...b,
            categories: b.categories.map((c) =>
              c.id === categoryId ? { ...c, spent } : c
            ),
          };
        })
      );
    },
    [setBudgets]
  );

  const addCategory = useCallback((budgetId: string, category: Omit<BudgetCategory, 'id'>) => {
    const newCat: BudgetCategory = { ...category, id: crypto.randomUUID() };
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id !== budgetId) return b;
        return { ...b, categories: [...b.categories, newCat] };
      })
    );
  }, [setBudgets]);

  const removeCategory = useCallback((budgetId: string, categoryId: string) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id !== budgetId) return b;
        return { ...b, categories: b.categories.filter((c) => c.id !== categoryId) };
      })
    );
  }, [setBudgets]);

  const deleteBudget = useCallback((id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, [setBudgets]);

  const currentBudget = useMemo(() => getCurrentBudget(), [getCurrentBudget]);

  const safeToSpend = useMemo(() => {
    if (!currentBudget) return 0;
    const totalAllocated = currentBudget.categories.reduce((s, c) => s + c.allocated, 0);
    const totalSpent = currentBudget.categories.reduce((s, c) => s + c.spent, 0);
    return currentBudget.totalIncome - totalAllocated + (totalAllocated - totalSpent);
  }, [currentBudget]);

  const unallocated = useMemo(() => {
    if (!currentBudget) return 0;
    const totalAllocated = currentBudget.categories.reduce((s, c) => s + c.allocated, 0);
    return currentBudget.totalIncome - totalAllocated;
  }, [currentBudget]);

  const overBudgetCategories = useMemo(() => {
    if (!currentBudget) return [];
    return currentBudget.categories.filter((c) => c.allocated > 0 && c.spent > c.allocated);
  }, [currentBudget]);

  return {
    budgets,
    currentBudget,
    createBudget,
    updateBudgetIncome,
    updateCategoryAllocation,
    updateCategorySpent,
    addCategory,
    removeCategory,
    deleteBudget,
    safeToSpend,
    unallocated,
    overBudgetCategories,
  };
}
