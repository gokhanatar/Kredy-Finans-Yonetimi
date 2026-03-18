import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface PrivacyModeContextType {
  isPrivate: boolean;
  toggle: () => void;
  setIsPrivate: (value: boolean) => void;
  formatAmount: (amount: number, currency?: string) => string;
  formatAmountShort: (amount: number) => string;
}

const PrivacyModeContext = createContext<PrivacyModeContextType | undefined>(undefined);

const LS_KEY = 'family-finance-privacy-mode';

function readStored(): boolean {
  try {
    const item = localStorage.getItem(LS_KEY);
    return item ? JSON.parse(item) : false;
  } catch {
    return false;
  }
}

function writeStored(value: boolean) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(value));
  } catch { /* ignore */ }
}

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  const [isPrivate, setIsPrivateState] = useState<boolean>(readStored);

  const setIsPrivate = useCallback((value: boolean) => {
    setIsPrivateState(value);
    writeStored(value);
  }, []);

  const toggle = useCallback(() => {
    setIsPrivateState((prev) => {
      const next = !prev;
      writeStored(next);
      return next;
    });
  }, []);

  const formatAmount = useCallback(
    (amount: number, currency: string = '₺') => {
      if (isPrivate) return '***';
      return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    },
    [isPrivate]
  );

  const formatAmountShort = useCallback(
    (amount: number) => {
      if (isPrivate) return '***';
      if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
      if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
      return amount.toLocaleString('tr-TR');
    },
    [isPrivate]
  );

  const value = useMemo(() => ({ isPrivate, toggle, setIsPrivate, formatAmount, formatAmountShort }), [isPrivate, toggle, setIsPrivate, formatAmount, formatAmountShort]);

  return (
    <PrivacyModeContext.Provider value={value}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyModeContext() {
  const context = useContext(PrivacyModeContext);
  if (context === undefined) {
    throw new Error('usePrivacyModeContext must be used within a PrivacyModeProvider');
  }
  return context;
}
