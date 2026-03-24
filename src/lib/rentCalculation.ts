// TUFE (CPI) inflation data — multi-source with fallback
const TCMB_EVDS_BASE = 'https://evds3.tcmb.gov.tr/service/evds';
const TUFE_SERIES = 'TP.FG.J0'; // TUFE 12 aylik ortalama
const CACHE_KEY = 'kredi-pusula-tufe-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback: last known TUFE rate (updated monthly)
// Source: TÜİK — Ocak 2026 yıllık TÜFE: %30.65
const FALLBACK_TUFE_RATE = 30.65;
const FALLBACK_DATE = '2026-01';

interface TufeCache {
  rate: number;
  fetchedAt: number;
  source: 'tcmb' | 'worldbank' | 'fallback';
}

/**
 * Fetches the latest TUFE (CPI) rate using a 3-tier strategy:
 * 1. TCMB EVDS API (if VITE_TCMB_API_KEY is set)
 * 2. World Bank Open Data API (free, no key required)
 * 3. Hardcoded fallback (updated monthly in code)
 * @returns The TUFE rate as a number (never null)
 */
export async function fetchTufeRate(): Promise<number> {
  // Check cache first
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      const cached: TufeCache = JSON.parse(cachedStr);
      if (Date.now() - cached.fetchedAt < CACHE_DURATION && cached.rate > 0) {
        return cached.rate;
      }
    }
  } catch {
    // Cache read failed, continue to fetch
  }

  // Strategy 1: TCMB EVDS (if API key available)
  const apiKey = import.meta.env.VITE_TCMB_API_KEY;
  if (apiKey) {
    const tcmbRate = await fetchFromTCMB(apiKey);
    if (tcmbRate) {
      cacheRate(tcmbRate, 'tcmb');
      return tcmbRate;
    }
  }

  // Strategy 2: World Bank Open Data API (free, no key)
  const wbRate = await fetchFromWorldBank();
  if (wbRate) {
    cacheRate(wbRate, 'worldbank');
    return wbRate;
  }

  // Strategy 3: Hardcoded fallback
  cacheRate(FALLBACK_TUFE_RATE, 'fallback');
  return FALLBACK_TUFE_RATE;
}

/**
 * Calculates rent increase based on current rent and inflation rate.
 */
export function calculateRentIncrease(
  currentRent: number,
  inflationRate: number
): { newRent: number; increaseAmount: number; rate: number } {
  const increase = currentRent * (inflationRate / 100);
  return {
    newRent: currentRent + increase,
    increaseAmount: increase,
    rate: inflationRate,
  };
}

// --- TCMB EVDS ---

async function fetchFromTCMB(apiKey: string): Promise<number | null> {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const startDate = formatDateForEVDS(threeMonthsAgo);
  const endDate = formatDateForEVDS(now);

  const params = new URLSearchParams({
    series: TUFE_SERIES,
    startDate,
    endDate,
    type: 'json',
  });

  const directUrl = `${TCMB_EVDS_BASE}?${params.toString()}`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any> | undefined;

    // Try direct fetch (native/Capacitor) — key as header (TCMB security requirement)
    try {
      const resp = await fetchWithTimeout(directUrl, 10000, {
        headers: { key: apiKey },
      });
      if (resp.ok) data = await resp.json();
    } catch {
      // CORS on web, try proxy
    }

    // Fallback: CORS proxy (key in URL)
    if (!data) {
      const proxyParams = new URLSearchParams({
        series: TUFE_SERIES, startDate, endDate, type: 'json', key: apiKey,
      });
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${TCMB_EVDS_BASE}?${proxyParams.toString()}`)}`;
      const proxyResp = await fetchWithTimeout(proxyUrl, 10000);
      if (proxyResp.ok) data = await proxyResp.json();
    }

    if (!data?.items?.length) return null;

    const latestItem = data.items[data.items.length - 1];
    const rate = parseFloat(latestItem[TUFE_SERIES]);
    return isNaN(rate) || rate <= 0 ? null : rate;
  } catch {
    return null;
  }
}

// --- World Bank Open Data API (free, no key) ---

async function fetchFromWorldBank(): Promise<number | null> {
  // World Bank Indicator: FP.CPI.TOTL.ZG = Inflation, consumer prices (annual %)
  // Returns most recent available year for Turkey
  const currentYear = new Date().getFullYear();
  const url = `https://api.worldbank.org/v2/country/TR/indicator/FP.CPI.TOTL.ZG?date=${currentYear - 2}:${currentYear}&format=json&per_page=5`;

  try {
    let data: unknown;

    // Direct fetch
    try {
      const resp = await fetchWithTimeout(url, 10000);
      if (resp.ok) data = await resp.json();
    } catch {
      // Try proxy
    }

    // CORS proxy fallback
    if (!data) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const resp = await fetchWithTimeout(proxyUrl, 10000);
      if (resp.ok) data = await resp.json();
    }

    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) return null;

    // Find latest non-null value
    for (const item of data[1]) {
      if (item?.value != null && typeof item.value === 'number' && item.value > 0) {
        return Math.round(item.value * 100) / 100;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// --- Helpers ---

function cacheRate(rate: number, source: TufeCache['source']) {
  try {
    const cacheData: TufeCache = { rate, fetchedAt: Date.now(), source };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Non-critical
  }
}

function formatDateForEVDS(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function fetchWithTimeout(url: string, timeoutMs: number, options?: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Fetch timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(url, { ...options, signal: controller.signal })
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
