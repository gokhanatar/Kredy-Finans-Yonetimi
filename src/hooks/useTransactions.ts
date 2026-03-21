
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
91
92
93
94
95
96
97
98 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
 