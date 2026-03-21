
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useFamilySyncedStorage } from './useFamilySyncedStorage';
import {
  Investment,
  InvestmentCategory,
  INVESTMENT_STORAGE_KEYS,
} from '@/types/investment';
 
// Shared investment operations logic
function useInvestmentOperations(
  investments: Investment[],
  setInvestments: (value: Investment[] | ((prev: Investment[]) => Investment[])) => void
) {
  const addInvestment = useCallback(
    (data: Omit<Investment, 'id' | 'createdAt'>) => {
      const newInvestment: Investment = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setInvestments((prev) => [...prev, newInvestment]);
      return newInvestment;
    },
    [setInvestments]
  );
 
  const updateInvestment = useCallback(
    (id: string, updates: Partial<Investment>) => {
      setInvestments((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
      );
    },
    [setInvestments]
  );
 
  const deleteInvestment = useCallback(
    (id: string) => {
      setInvestments((prev) => prev.filter((inv) => inv.id !== id));
    },
    [setInvestments]
  );
 
  const investmentsByCategory = useMemo(() => {
    const grouped: Record<InvestmentCategory, Investment[]> = {
      altin: [],
      gumus: [],
      doviz: [],
      hisse: [],
      kripto: [],
    };
    investments.forEach((inv) => {
      if (grouped[inv.category]) {
        grouped[inv.category].push(inv);
      }
    });
    return grouped;
  }, [investments]);
 
  const totalInvested = useMemo(() => {
    return investments.reduce(
      (sum, inv) => sum + inv.quantity * inv.purchasePrice,
      0
    );
  }, [investments]);
 
  return {
    investments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    investmentsByCategory,
    totalInvested,
  };
}
 
export function useInvestments() {
  const [investments, setInvestments] = useLocalStorage<Investment[]>(
    INVESTMENT_STORAGE_KEYS.INVESTMENTS,
    []
  );
  return useInvestmentOperations(investments, setInvestments);
}
 
export function useFamilyInvestments() {
  const [investments, setInvestments] = useFamilySyncedStorage<Investment[]>(
    'kredi-pusula-family-investments',
    []
  );
  return useInvestmentOperations(investments, setInvestments);
}
 