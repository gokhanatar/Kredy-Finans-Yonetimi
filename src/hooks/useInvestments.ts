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
