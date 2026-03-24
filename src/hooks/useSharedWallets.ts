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
