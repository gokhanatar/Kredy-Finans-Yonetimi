import { useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { CurrencyRates, CurrencyCode, FAMILY_STORAGE_KEYS } from '@/types/familyFinance';

const DEFAULT_RATES: CurrencyRates = {
  base: 'TRY',
  rates: { TRY: 1, USD: 0.027, EUR: 0.025, GBP: 0.021 },
  lastUpdated: '',
};

const ONE_HOUR = 60 * 60 * 1000;

export function useCurrencyRates() {
  const [ratesData, setRatesData] = useLocalStorage<CurrencyRates>(
    FAMILY_STORAGE_KEYS.CURRENCY_RATES,
    DEFAULT_RATES
  );

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
      if (!res.ok) throw new Error('Rate fetch failed');
      const data = await res.json();

      const rates: Record<CurrencyCode, number> = {
        TRY: 1,
        USD: data.rates?.USD || DEFAULT_RATES.rates.USD,
        EUR: data.rates?.EUR || DEFAULT_RATES.rates.EUR,
        GBP: data.rates?.GBP || DEFAULT_RATES.rates.GBP,
      };

      setRatesData({
        base: 'TRY',
        rates,
        lastUpdated: new Date().toISOString(),
      });
    } catch {
      // Keep existing rates on error
      console.warn('Currency rate fetch failed, using cached rates');
    }
  }, [setRatesData]);

  // Auto-refresh if stale (older than 1 hour)
  useEffect(() => {
    if (!ratesData.lastUpdated) {
      fetchRates();
      return;
    }

    const elapsed = Date.now() - new Date(ratesData.lastUpdated).getTime();
    if (elapsed > ONE_HOUR) {
      fetchRates();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const convert = useCallback(
    (amount: number, from: CurrencyCode, to: CurrencyCode): number => {
      if (from === to) return amount;

      const fromRate = ratesData.rates[from] || 1;
      const toRate = ratesData.rates[to] || 1;

      // Convert through TRY as base
      if (from === 'TRY') {
        return amount * toRate;
      }
      if (to === 'TRY') {
        return amount / fromRate;
      }
      // Cross-rate
      const inTRY = amount / fromRate;
      return inTRY * toRate;
    },
    [ratesData.rates]
  );

  const getRate = useCallback(
    (from: CurrencyCode, to: CurrencyCode): number => {
      return convert(1, from, to);
    },
    [convert]
  );

  const isStale = useMemo(() => {
    if (!ratesData.lastUpdated) return true;
    return Date.now() - new Date(ratesData.lastUpdated).getTime() > ONE_HOUR;
  }, [ratesData.lastUpdated]);

  return {
    rates: ratesData.rates,
    lastUpdated: ratesData.lastUpdated,
    fetchRates,
    convert,
    getRate,
    isStale,
  };
}
