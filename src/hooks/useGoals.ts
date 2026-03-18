import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { Goal, GoalContribution, FAMILY_STORAGE_KEYS } from '@/types/familyFinance';

export function useGoals(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [goals, setGoals] = useStorageForScope<Goal[]>(storageKey || FAMILY_STORAGE_KEYS.GOALS, [], scope);

  const addGoal = useCallback((data: Omit<Goal, 'id' | 'contributions' | 'currentAmount'>) => {
    const newGoal: Goal = {
      ...data,
      id: crypto.randomUUID(),
      currentAmount: 0,
      contributions: [],
    };
    setGoals((prev) => [...prev, newGoal]);
    return newGoal;
  }, [setGoals]);

  const updateGoal = useCallback((id: string, updates: Partial<Omit<Goal, 'contributions'>>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }, [setGoals]);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, [setGoals]);

  const addContribution = useCallback((goalId: string, amount: number, note?: string) => {
    const contribution: GoalContribution = {
      id: crypto.randomUUID(),
      amount,
      date: new Date().toISOString(),
      note,
    };

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          currentAmount: g.currentAmount + amount,
          contributions: [...g.contributions, contribution],
        };
      })
    );

    return contribution;
  }, [setGoals]);

  const removeContribution = useCallback((goalId: string, contributionId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const contribution = g.contributions.find((c) => c.id === contributionId);
        if (!contribution) return g;
        return {
          ...g,
          currentAmount: Math.max(0, g.currentAmount - contribution.amount),
          contributions: g.contributions.filter((c) => c.id !== contributionId),
        };
      })
    );
  }, [setGoals]);

  const getProgress = useCallback((goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.targetAmount === 0) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  }, [goals]);

  const totalSaved = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.currentAmount, 0);
  }, [goals]);

  const totalTarget = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.targetAmount, 0);
  }, [goals]);

  const completedGoals = useMemo(() => {
    return goals.filter((g) => g.currentAmount >= g.targetAmount);
  }, [goals]);

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    removeContribution,
    getProgress,
    totalSaved,
    totalTarget,
    completedGoals,
  };
}
