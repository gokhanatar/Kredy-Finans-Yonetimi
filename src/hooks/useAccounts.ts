
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
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { Account, FAMILY_STORAGE_KEYS, CurrencyCode } from '@/types/familyFinance';
import { calculateKMHDailyInterest, calculateDaysNegative, getKMHSeverity } from '@/lib/kmhUtils';
 
export function useAccounts(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [accounts, setAccounts] = useStorageForScope<Account[]>(storageKey || FAMILY_STORAGE_KEYS.ACCOUNTS, [], scope);
 
  const addAccount = useCallback((data: Omit<Account, 'id'>) => {
    const newAccount: Account = { ...data, id: crypto.randomUUID() };
    setAccounts((prev) => [...prev, newAccount]);
    return newAccount;
  }, [setAccounts]);
 
  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, [setAccounts]);
 
  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, [setAccounts]);
 
  const updateBalance = useCallback((id: string, amount: number, operation: 'add' | 'subtract') => {
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const newBalance = operation === 'add' ? a.balance + amount : a.balance - amount;
        const updates: Partial<Account> = { balance: newBalance };
 
        // Track KMH negative date
        if (a.kmhEnabled) {
          if (newBalance < 0 && a.balance >= 0) {
            updates.kmhLastNegativeDate = new Date().toISOString();
          } else if (newBalance >= 0 && a.balance < 0) {
            updates.kmhLastNegativeDate = undefined;
            updates.kmhAccruedInterest = 0;
          }
        }
 
        return { ...a, ...updates };
      })
    );
  }, [setAccounts]);
 
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);
 
  const getAccountsByType = useCallback((type: Account['type']) => {
    return accounts.filter((a) => a.type === type);
  }, [accounts]);
 
  const getAccountsByCurrency = useCallback((currency: CurrencyCode) => {
    return accounts.filter((a) => a.currency === currency);
  }, [accounts]);
 
  // KMH-specific queries
  const getKMHAccounts = useCallback(() => {
    return accounts.filter((a) => a.type === 'bank' && a.kmhEnabled);
  }, [accounts]);
 
  const kmhSummary = useMemo(() => {
    const kmhAccounts = accounts.filter((a) => a.type === 'bank' && a.kmhEnabled && a.balance < 0);
    if (kmhAccounts.length === 0) {
      return { count: 0, totalUsed: 0, totalLimit: 0, totalDailyInterest: 0 };
    }
 
    let totalUsed = 0;
    let totalLimit = 0;
    let totalDailyInterest = 0;
 
    for (const account of kmhAccounts) {
      totalUsed += Math.abs(account.balance);
      totalLimit += account.kmhLimit || 0;
      const days = calculateDaysNegative(account.kmhLastNegativeDate) || 1;
      const interest = calculateKMHDailyInterest(
        account.balance,
        account.kmhInterestRate || 4.25,
        days,
      );
      totalDailyInterest += interest.netCost;
    }
 
    return {
      count: kmhAccounts.length,
      totalUsed,
      totalLimit,
      totalDailyInterest,
    };
  }, [accounts]);
 
  const updateKMHInterest = useCallback(() => {
    setAccounts((prev) =>
      prev.map((a) => {
        if (!a.kmhEnabled || a.balance >= 0 || !a.kmhLastNegativeDate) return a;
        const days = calculateDaysNegative(a.kmhLastNegativeDate);
        const interest = calculateKMHDailyInterest(
          a.balance,
          a.kmhInterestRate || 4.25,
          days,
        );
        return { ...a, kmhAccruedInterest: interest.netCost };
      })
    );
  }, [setAccounts]);
 
  return {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    updateBalance,
    totalBalance,
    getAccountsByType,
    getAccountsByCurrency,
    getKMHAccounts,
    kmhSummary,
    updateKMHInterest,
  };
}
 