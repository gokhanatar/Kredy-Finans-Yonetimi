
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
 