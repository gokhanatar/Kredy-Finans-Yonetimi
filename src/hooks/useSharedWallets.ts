
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback, useMemo } from 'react';
import { useStorageForScope } from './useStorageForScope';
import { SharedWallet, SharedTransaction, FAMILY_STORAGE_KEYS, SplitType } from '@/types/familyFinance';
 
export function useSharedWallets(storageKey?: string, scope: 'personal' | 'family' = 'personal') {
  const [wallets, setWallets] = useStorageForScope<SharedWallet[]>(storageKey || FAMILY_STORAGE_KEYS.SHARED_WALLETS, [], scope);
 
  const addWallet = useCallback((data: Omit<SharedWallet, 'id' | 'transactions'>) => {
    const newWallet: SharedWallet = {
      ...data,
      id: crypto.randomUUID(),
      transactions: [],
    };
    setWallets((prev) => [...prev, newWallet]);
    return newWallet;
  }, [setWallets]);
 
  const updateWallet = useCallback((id: string, updates: Partial<Omit<SharedWallet, 'transactions'>>) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, [setWallets]);
 
  const deleteWallet = useCallback((id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  }, [setWallets]);
 
  const addTransaction = useCallback(
    (walletId: string, data: Omit<SharedTransaction, 'id' | 'walletId'>) => {
      const newTx: SharedTransaction = {
        ...data,
        id: crypto.randomUUID(),
        walletId,
      };
 
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id !== walletId) return w;
          return { ...w, transactions: [...w.transactions, newTx] };
        })
      );
 
      return newTx;
    },
    [setWallets]
  );
 
  const deleteTransaction = useCallback((walletId: string, txId: string) => {
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== walletId) return w;
        return { ...w, transactions: w.transactions.filter((t) => t.id !== txId) };
      })
    );
  }, [setWallets]);
 
  const getBalances = useCallback((walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return {};
 
    const balances: Record<string, number> = {};
    wallet.members.forEach((m) => { balances[m] = 0; });
 
    wallet.transactions.forEach((tx) => {
      const memberCount = wallet.members.length;
      if (tx.splitType === 'equal') {
        const share = tx.amount / memberCount;
        wallet.members.forEach((m) => {
          if (m === tx.paidBy) {
            balances[m] += tx.amount - share;
          } else {
            balances[m] -= share;
          }
        });
      } else if (tx.splitType === 'custom' && tx.splits) {
        tx.splits.forEach((split) => {
          if (split.member === tx.paidBy) {
            balances[split.member] += tx.amount - split.amount;
          } else {
            balances[split.member] -= split.amount;
          }
        });
      }
    });
 
    return balances;
  }, [wallets]);
 
  const getTotalSpent = useCallback((walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return 0;
    return wallet.transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [wallets]);
 
  return {
    wallets,
    addWallet,
    updateWallet,
    deleteWallet,
    addTransaction,
    deleteTransaction,
    getBalances,
    getTotalSpent,
  };
}
 