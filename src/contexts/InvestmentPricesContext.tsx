import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useInvestmentPrices } from '@/hooks/useInvestmentPrices';

type InvestmentPricesContextType = ReturnType<typeof useInvestmentPrices>;

const InvestmentPricesContext = createContext<InvestmentPricesContextType | null>(null);

export function InvestmentPricesProvider({ children }: { children: ReactNode }) {
  const prices = useInvestmentPrices();
  const value = useMemo(() => prices, [prices.priceCache, prices.isRefreshing, prices.refreshPrices, prices.getPrice, prices.getCurrentValue, prices.isStale, prices.lastFetched, prices.lastFetchedText]);
  return (
    <InvestmentPricesContext.Provider value={value}>
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
