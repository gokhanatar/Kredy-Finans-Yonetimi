import { createContext, useContext, ReactNode } from 'react';
import { useInvestmentPrices } from '@/hooks/useInvestmentPrices';

type InvestmentPricesContextType = ReturnType<typeof useInvestmentPrices>;

const InvestmentPricesContext = createContext<InvestmentPricesContextType | null>(null);

export function InvestmentPricesProvider({ children }: { children: ReactNode }) {
  const prices = useInvestmentPrices();
  return (
    <InvestmentPricesContext.Provider value={prices}>
      {children}
    </InvestmentPricesContext.Provider>
  );
}

export function useInvestmentPricesContext() {
  const context = useContext(InvestmentPricesContext);
  if (!context) {
    throw new Error('useInvestmentPricesContext must be used within InvestmentPricesProvider');
  }
  return context;
}
