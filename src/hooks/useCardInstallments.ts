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
      setInstallments((prev) => {
        const inst = prev.find((i) => i.id === id);
        if (!inst || inst.completedAt) return prev;

        const newPaid = inst.paidInstallments + 1;
        const isComplete = newPaid >= inst.installmentCount;

        // Reduce card debt (side effect, but safe since we have fresh data)
        recordCardPayment(inst.cardId, inst.monthlyPayment);

        return prev.map((i) =>
          i.id === id
            ? {
                ...i,
                paidInstallments: newPaid,
                completedAt: isComplete ? new Date().toISOString() : undefined,
              }
            : i
        );
      });
    },
    [setInstallments, recordCardPayment]
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
