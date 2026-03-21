
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
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { RecurringIncome, FAMILY_STORAGE_KEYS } from '@/types/familyFinance';
 
export function useRecurringIncomes(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [incomes, setIncomes] = useStorageForScope<RecurringIncome[]>(
    storageKey || FAMILY_STORAGE_KEYS.RECURRING_INCOMES,
    [],
    scope
  );
 
  const addIncome = useCallback((data: Omit<RecurringIncome, 'id'>) => {
    const newInc: RecurringIncome = { ...data, id: crypto.randomUUID() };
    setIncomes((prev) => [...prev, newInc]);
    return newInc;
  }, [setIncomes]);
 
  const updateIncome = useCallback((id: string, updates: Partial<RecurringIncome>) => {
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, [setIncomes]);
 
  const deleteIncome = useCallback((id: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  }, [setIncomes]);
 
  const toggleActive = useCallback((id: string) => {
    setIncomes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i))
    );
  }, [setIncomes]);
 
  const monthlyTotal = useMemo(() => {
    return incomes
      .filter((i) => i.isActive)
      .reduce((sum, i) => {
        switch (i.frequency) {
          case 'monthly': return sum + i.amount;
          case 'weekly': return sum + i.amount * 4.33;
          case 'biweekly': return sum + i.amount * 2.17;
          case 'yearly': return sum + i.amount / 12;
          case 'one-time': return sum;
          default: return sum;
        }
      }, 0);
  }, [incomes]);
 
  const yearlyTotal = useMemo(() => {
    return incomes
      .filter((i) => i.isActive)
      .reduce((sum, i) => {
        switch (i.frequency) {
          case 'monthly': return sum + i.amount * 12;
          case 'weekly': return sum + i.amount * 52;
          case 'biweekly': return sum + i.amount * 26;
          case 'yearly': return sum + i.amount;
          case 'one-time': return sum + i.amount;
          default: return sum;
        }
      }, 0);
  }, [incomes]);
 
  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inc of incomes.filter((i) => i.isActive)) {
      let monthly = 0;
      switch (inc.frequency) {
        case 'monthly': monthly = inc.amount; break;
        case 'weekly': monthly = inc.amount * 4.33; break;
        case 'biweekly': monthly = inc.amount * 2.17; break;
        case 'yearly': monthly = inc.amount / 12; break;
        case 'one-time': monthly = 0; break;
      }
      const key = inc.category;
      map[key] = (map[key] || 0) + monthly;
    }
    return map;
  }, [incomes]);
 
  return {
    incomes,
    addIncome,
    updateIncome,
    deleteIncome,
    toggleActive,
    monthlyTotal,
    yearlyTotal,
    incomeByCategory,
  };
}
 