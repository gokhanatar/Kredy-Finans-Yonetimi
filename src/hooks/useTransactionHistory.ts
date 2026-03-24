import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';

export type TransactionType = 'income' | 'expense' | 'card_payment' | 'purchase' | 'simulator' | 'investment' | 'goal' | 'transfer';

export interface TransactionHistoryEntry {
  id: string;
  type: TransactionType;
  title: string;
  description?: string;
  amount?: number;
  category?: string;
  date: string;
  createdAt: string;
}

const TYPE_ICONS: Record<TransactionType, string> = {
  income: '💰',
  expense: '💸',
  card_payment: '💳',
  purchase: '🛒',
  simulator: '🧮',
  investment: '📈',
  goal: '🎯',
  transfer: '🔄',
};

const TYPE_COLORS: Record<TransactionType, string> = {
  income: 'text-success',
  expense: 'text-destructive',
  card_payment: 'text-primary',
  purchase: 'text-warning',
  simulator: 'text-info',
  investment: 'text-violet-500',
  goal: 'text-teal-500',
  transfer: 'text-orange-500',
};

export function useTransactionHistory() {
  const [history, setHistory] = useLocalStorage<TransactionHistoryEntry[]>(
    'kredi-pusula-transaction-history',
    []
  );

  const addEntry = useCallback((entry: Omit<TransactionHistoryEntry, 'id' | 'createdAt'>) => {
    const newEntry: TransactionHistoryEntry = {
      ...entry,
      id: `th_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [newEntry, ...prev].slice(0, 500)); // Keep last 500 entries
    return newEntry;
  }, [setHistory]);

  const deleteEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const getEntriesByType = useCallback((type: TransactionType) => {
    return history.filter((e) => e.type === type);
  }, [history]);

  return {
    history,
    addEntry,
    deleteEntry,
    clearHistory,
    getEntriesByType,
    TYPE_ICONS,
    TYPE_COLORS,
  };
}
