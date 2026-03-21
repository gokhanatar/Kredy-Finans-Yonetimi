
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
122
123
124
125
126
127
128
129
130
131
132 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback, useMemo } from 'react';
import { useFamilySyncedStorage } from './useFamilySyncedStorage';
import { useCardPayment } from './useCardPayment';
import type { CardInstallment } from '@/types/finance';
 
export function useCardInstallments(storageKey?: string) {
  const [installments, setInstallments] = useFamilySyncedStorage<CardInstallment[]>(
    'kredi-pusula-card-installments',
    []
  );
  const { recordCardPayment } = useCardPayment(storageKey);
 
  const getActiveByCard = useCallback(
    (cardId: string) =>
      installments.filter((i) => i.cardId === cardId && !i.completedAt),
    [installments]
  );
 
  const getCompletedByCard = useCallback(
    (cardId: string) =>
      installments.filter((i) => i.cardId === cardId && !!i.completedAt),
    [installments]
  );
 
  const getCardInstallmentDebt = useCallback(
    (cardId: string) =>
      installments
        .filter((i) => i.cardId === cardId && !i.completedAt)
        .reduce(
          (sum, i) => sum + (i.installmentCount - i.paidInstallments) * i.monthlyPayment,
          0
        ),
    [installments]
  );
 
  const getCardMonthlyBurden = useCallback(
    (cardId: string) =>
      installments
        .filter((i) => i.cardId === cardId && !i.completedAt)
        .reduce((sum, i) => sum + i.monthlyPayment, 0),
    [installments]
  );
 
  const addInstallment = useCallback(
    (data: Omit<CardInstallment, 'id' | 'createdAt' | 'paidInstallments' | 'isRetroactive' | 'completedAt'>) => {
      const newInstallment: CardInstallment = {
        ...data,
        id: crypto.randomUUID(),
        paidInstallments: 0,
        isRetroactive: false,
        createdAt: new Date().toISOString(),
      };
      setInstallments((prev) => [...prev, newInstallment]);
      return newInstallment;
    },
    [setInstallments]
  );
 
  const addRetroactiveInstallment = useCallback(
    (
      data: Omit<CardInstallment, 'id' | 'createdAt' | 'isRetroactive' | 'completedAt'> & {
        paidInstallments: number;
      }
    ) => {
      const isComplete = data.paidInstallments >= data.installmentCount;
      const newInstallment: CardInstallment = {
        ...data,
        id: crypto.randomUUID(),
        isRetroactive: true,
        createdAt: new Date().toISOString(),
        completedAt: isComplete ? new Date().toISOString() : undefined,
      };
      setInstallments((prev) => [...prev, newInstallment]);
      return newInstallment;
    },
    [setInstallments]
  );
 
  const markInstallmentPaid = useCallback(
    (id: string) => {
      const inst = installments.find((i) => i.id === id);
      if (!inst || inst.completedAt) return;
 
      const newPaid = inst.paidInstallments + 1;
      const isComplete = newPaid >= inst.installmentCount;
 
      setInstallments((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                paidInstallments: newPaid,
                completedAt: isComplete ? new Date().toISOString() : undefined,
              }
            : i
        )
      );
 
      // Reduce card debt
      recordCardPayment(inst.cardId, inst.monthlyPayment);
    },
    [installments, setInstallments, recordCardPayment]
  );
 
  const deleteInstallment = useCallback(
    (id: string) => {
      setInstallments((prev) => prev.filter((i) => i.id !== id));
    },
    [setInstallments]
  );
 
  const deleteInstallmentsByCard = useCallback(
    (cardId: string) => {
      setInstallments((prev) => prev.filter((i) => i.cardId !== cardId));
    },
    [setInstallments]
  );
 
  return {
    installments,
    getActiveByCard,
    getCompletedByCard,
    getCardInstallmentDebt,
    getCardMonthlyBurden,
    addInstallment,
    addRetroactiveInstallment,
    markInstallmentPaid,
    deleteInstallment,
    deleteInstallmentsByCard,
  };
}
 