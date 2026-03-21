
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
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214
215
216
217
218
219
220
221
222
223
224
225
226
227
228
229
230
231
232
233
234
235
236
237
238
239
240
241
242
243
244
245
246
247
248
249
250
251
252
253
254
255
256
257
258
259
260
261
262
263
264
265
266
267
268
269
270
271
272
273
274
275
276
277
278
279
280
281
282
283
284
285
286
287
288
289
290
291
292
293
294
295
296
297
298
299
300
301
302
303
304
305
306
307
308
309
310
311
312
313
314
315
316
317
318
319
320
321
322
323
324
325
326
327
328
329
330
331
332
333
334
335
336
337
338
339
340
341
342
343
344
345
346
347
348
349
350
351
352
353
354
355
356
357
358
359
360
361
362
363
364
365
366
367
368
369
370
371
372
373
374
375
376
377
378
379
380
381
382
383
384
385
386
387
388
389
390
391
392
393
394
395
396
397
398
399
400
401
402
403
404
405
406
407
408
409
410
411
412
413 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocalStorage } from './useLocalStorage';
import {
  InvestmentPriceCache,
  InvestmentPrice,
  INVESTMENT_STORAGE_KEYS,
  DEFAULT_GOLD_PRICES,
  DEFAULT_SILVER_PRICES,
  DEFAULT_CURRENCY_PRICES,
  InvestmentSubType,
  CRYPTO_COINGECKO_MAP,
  COINGECKO_TO_NAME,
  POPULAR_BIST_STOCKS,
  POPULAR_US_STOCKS,
  GOLD_ITEMS,
} from '@/types/investment';
 
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const BATCH_SIZE = 40;
 
const DEFAULT_CACHE: InvestmentPriceCache = {
  gold: DEFAULT_GOLD_PRICES,
  silver: DEFAULT_SILVER_PRICES,
  currency: DEFAULT_CURRENCY_PRICES,
  crypto: [],
  stocks: [],
  lastFetched: '',
};
 
function normalizeCache(raw: InvestmentPriceCache): InvestmentPriceCache {
  return {
    gold: raw.gold || DEFAULT_GOLD_PRICES,
    silver: raw.silver || DEFAULT_SILVER_PRICES,
    currency: raw.currency || DEFAULT_CURRENCY_PRICES,
    crypto: raw.crypto || [],
    stocks: raw.stocks || [],
    lastFetched: raw.lastFetched || '',
  };
}
 
// Fetch helper: on Capacitor native, regular fetch is auto-patched to bypass CORS.
// On web, try direct first, then CORS proxy fallback.
async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  // Direct fetch (works on native via Capacitor HTTP patching)
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch { /* CORS or network error on web */ }
 
  // Web fallback: CORS proxy
  if (!Capacitor.isNativePlatform()) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) return await res.json();
    } catch { /* proxy failed */ }
  }
 
  return null;
}
 
export function useInvestmentPrices() {
  const [rawCache, setPriceCache] = useLocalStorage<InvestmentPriceCache>(
    INVESTMENT_STORAGE_KEYS.INVESTMENT_PRICES,
    DEFAULT_CACHE
  );
  const priceCache = useMemo(() => normalizeCache(rawCache), [rawCache]);
  const [isRefreshing, setIsRefreshing] = useState(false);
 
  // --- Currency ---
  const fetchCurrencyPrices = useCallback(async (): Promise<InvestmentPrice[]> => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
      if (!res.ok) throw new Error('Currency fetch failed');
      const data = await res.json();
      const now = new Date().toISOString();
      const currencies = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SAR'];
      return currencies.map((code) => {
        const rate = data.rates?.[code];
        if (!rate || rate === 0) {
          return DEFAULT_CURRENCY_PRICES.find((p) => p.type === code) ||
            { type: code, buyPrice: 0, sellPrice: 0, lastUpdated: now };
        }
        const tryPrice = 1 / rate;
        const spread = tryPrice * 0.005;
        return {
          type: code,
          buyPrice: Math.round((tryPrice + spread) * 100) / 100,
          sellPrice: Math.round((tryPrice - spread) * 100) / 100,
          lastUpdated: now,
        };
      });
    } catch {
      return DEFAULT_CURRENCY_PRICES;
    }
  }, []);
 
  // --- Gold & Silver ---
  const fetchGoldPrices = useCallback(async (): Promise<{
    gold: InvestmentPrice[];
    silver: InvestmentPrice[];
  }> => {
    const now = new Date().toISOString();
 
    try {
      const res = await fetch('https://finans.truncgil.com/today.json');
      if (res.ok) {
        const data = await res.json();
        const goldPrices: InvestmentPrice[] = [];
        const silverPrices: InvestmentPrice[] = [];
 
        // Direct API mapping
        const goldMapping: Record<string, string> = {
          'gram-altin': 'gram_altin',
          'ceyrek-altin': 'ceyrek_altin',
          'yarim-altin': 'yarim_altin',
          'tam-altin': 'tam_altin',
          'cumhuriyet-altini': 'cumhuriyet_altini',
          'ata-altin': 'ata_altin',
          'resat-altin': 'resat_altin',
          'hamit-altin': 'hamit_altin',
          'gremse-altin': 'gremse_altin',
          '14-ayar-altin': '14_ayar',
          '18-ayar-altin': '18_ayar',
          '22-ayar-altin': '22_ayar',
        };
        const parsePrice = (val: unknown): number =>
          parseFloat(String(val || '0').replace('.', '').replace(',', '.'));
 
        for (const [apiKey, ourType] of Object.entries(goldMapping)) {
          const item = data[apiKey];
          if (item) {
            const buying = parsePrice(item['Alış'] || item['Alis']);
            const selling = parsePrice(item['Satış'] || item['Satis']);
            if (buying > 0 || selling > 0) {
              goldPrices.push({ type: ourType, buyPrice: buying, sellPrice: selling, lastUpdated: now });
            }
          }
        }
 
        // 24_ayar = gram_altin
        const gramPrice = goldPrices.find((p) => p.type === 'gram_altin');
        if (gramPrice && !goldPrices.find((p) => p.type === '24_ayar')) {
          goldPrices.push({ ...gramPrice, type: '24_ayar' });
        }
 
        // Derive prices for ALL GOLD_ITEMS not already fetched from API
        const fetchedTypes = new Set(goldPrices.map((p) => p.type));
        const gramBuy = gramPrice?.buyPrice || 3250;
        const gramSell = gramPrice?.sellPrice || 3220;
        const ayar22 = goldPrices.find((p) => p.type === '22_ayar');
        const ayar22Buy = ayar22?.buyPrice || gramBuy * (22 / 24);
        const ayar22Sell = ayar22?.sellPrice || gramSell * (22 / 24);
        const ayar18 = goldPrices.find((p) => p.type === '18_ayar');
        const ayar18Buy = ayar18?.buyPrice || gramBuy * (18 / 24);
        const ayar18Sell = ayar18?.sellPrice || gramSell * (18 / 24);
        const ayar14 = goldPrices.find((p) => p.type === '14_ayar');
        const ayar14Buy = ayar14?.buyPrice || gramBuy * (14 / 24);
        const ayar14Sell = ayar14?.sellPrice || gramSell * (14 / 24);
 
        for (const item of GOLD_ITEMS) {
          if (fetchedTypes.has(item.id)) continue;
 
          // Determine per-unit price based on ayar
          let unitBuy: number;
          let unitSell: number;
          if (item.ayar === 24) { unitBuy = gramBuy; unitSell = gramSell; }
          else if (item.ayar === 22) { unitBuy = ayar22Buy; unitSell = ayar22Sell; }
          else if (item.ayar === 18) { unitBuy = ayar18Buy; unitSell = ayar18Sell; }
          else if (item.ayar === 14) { unitBuy = ayar14Buy; unitSell = ayar14Sell; }
          else { unitBuy = gramBuy * (item.ayar / 24); unitSell = gramSell * (item.ayar / 24); }
 
          if (item.fixedGramPerPiece && !item.needsGramInput) {
            // Piece-based: price per piece = gram price × weight
            unitBuy = unitBuy * item.fixedGramPerPiece;
            unitSell = unitSell * item.fixedGramPerPiece;
          }
          // Gram-based items: price stays per gram (already correct)
 
          goldPrices.push({
            type: item.id,
            buyPrice: Math.round(unitBuy * 100) / 100,
            sellPrice: Math.round(unitSell * 100) / 100,
            lastUpdated: now,
          });
        }
 
        // Silver
        const gumusItem = data['gumus'];
        if (gumusItem) {
          const buying = parsePrice(gumusItem['Alış'] || gumusItem['Alis']);
          const selling = parsePrice(gumusItem['Satış'] || gumusItem['Satis']);
          if (buying > 0 || selling > 0) {
            silverPrices.push({ type: 'gram_gumus', buyPrice: buying, sellPrice: selling, lastUpdated: now });
            // 925 = 92.5% of pure silver
            silverPrices.push({
              type: 'gumus_925',
              buyPrice: Math.round(buying * 0.925 * 100) / 100,
              sellPrice: Math.round(selling * 0.925 * 100) / 100,
              lastUpdated: now,
            });
          }
        }
        // Add defaults for metals not from API
        silverPrices.push(
          ...DEFAULT_SILVER_PRICES.filter((p) =>
            ['platin', 'paladyum', 'bakir', 'titanyum'].includes(p.type) &&
            !silverPrices.find((sp) => sp.type === p.type)
          )
        );
 
        if (goldPrices.length > 0) {
          return {
            gold: goldPrices,
            silver: silverPrices.length > 0 ? silverPrices : DEFAULT_SILVER_PRICES,
          };
        }
      }
    } catch { /* fall through */ }
 
    return { gold: DEFAULT_GOLD_PRICES, silver: DEFAULT_SILVER_PRICES };
  }, []);
 
  // --- Crypto (CoinGecko) ---
  const fetchCryptoPrices = useCallback(async (): Promise<InvestmentPrice[]> => {
    try {
      const ids = Object.values(CRYPTO_COINGECKO_MAP).join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=try`
      );
      if (!res.ok) throw new Error('CoinGecko fetch failed');
      const data = await res.json();
      const now = new Date().toISOString();
      const prices: InvestmentPrice[] = [];
 
      for (const [cgId, tryPrice] of Object.entries(data)) {
        const name = COINGECKO_TO_NAME[cgId];
        if (name && tryPrice && typeof tryPrice === 'object' && 'try' in tryPrice) {
          const price = (tryPrice as Record<string, number>).try;
          prices.push({
            type: name,
            buyPrice: price,
            sellPrice: price,
            lastUpdated: now,
          });
        }
      }
      return prices;
    } catch {
      return [];
    }
  }, []);
 
  // --- Stocks (Yahoo Finance, batched) ---
  const fetchStockBatch = useCallback(async (
    symbols: string[],
    usdToTry: number
  ): Promise<InvestmentPrice[]> => {
    const now = new Date().toISOString();
    const prices: InvestmentPrice[] = [];
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
 
    const data = await fetchJson(url);
    if (!data) return prices;
 
    const results = (data as Record<string, Record<string, unknown>>)?.quoteResponse?.result;
    if (!Array.isArray(results)) return prices;
 
    for (const quote of results) {
      const rawSymbol = String(quote.symbol || '');
      const marketPrice = Number(quote.regularMarketPrice || 0);
      const currency = String(quote.currency || '');
      if (!rawSymbol || marketPrice <= 0) continue;
 
      const symbol = rawSymbol.replace('.IS', '');
      let tryPrice = marketPrice;
 
      if (currency === 'USD' && usdToTry > 0) {
        tryPrice = marketPrice * usdToTry;
      }
 
      prices.push({
        type: symbol,
        buyPrice: Math.round(tryPrice * 100) / 100,
        sellPrice: Math.round(tryPrice * 100) / 100,
        lastUpdated: now,
      });
    }
    return prices;
  }, []);
 
  const fetchStockPrices = useCallback(async (usdToTry: number): Promise<InvestmentPrice[]> => {
    const bistSymbols = POPULAR_BIST_STOCKS.map((s) => `${s}.IS`);
    const usSymbols = [...POPULAR_US_STOCKS];
    const allSymbols = [...bistSymbols, ...usSymbols];
 
    // Split into batches
    const batches: string[][] = [];
    for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
      batches.push(allSymbols.slice(i, i + BATCH_SIZE));
    }
 
    const results = await Promise.allSettled(
      batches.map((batch) => fetchStockBatch(batch, usdToTry))
    );
 
    const prices: InvestmentPrice[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        prices.push(...result.value);
      }
    }
    return prices;
  }, [fetchStockBatch]);
 
  // --- Refresh All ---
  const refreshPrices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const currencyResult = await fetchCurrencyPrices();
      const usdPrice = currencyResult.find((p) => p.type === 'USD');
      const usdToTry = usdPrice ? usdPrice.sellPrice : 36.3;
 
      const [metals, crypto, stocks] = await Promise.allSettled([
        fetchGoldPrices(),
        fetchCryptoPrices(),
        fetchStockPrices(usdToTry),
      ]);
 
      const goldSilver = metals.status === 'fulfilled'
        ? metals.value
        : { gold: DEFAULT_GOLD_PRICES, silver: DEFAULT_SILVER_PRICES };
      const cryptoPrices = crypto.status === 'fulfilled' ? crypto.value : [];
      const stockPrices = stocks.status === 'fulfilled' ? stocks.value : [];
 
      setPriceCache({
        gold: goldSilver.gold,
        silver: goldSilver.silver,
        currency: currencyResult,
        crypto: cryptoPrices,
        stocks: stockPrices,
        lastFetched: new Date().toISOString(),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchGoldPrices, fetchCurrencyPrices, fetchCryptoPrices, fetchStockPrices, setPriceCache]);
 
  // Auto-refresh if stale on mount
  useEffect(() => {
    const lastFetched = priceCache.lastFetched;
    if (!lastFetched) {
      refreshPrices();
      return;
    }
    const elapsed = Date.now() - new Date(lastFetched).getTime();
    if (elapsed > CACHE_TTL) {
      refreshPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const getPrice = useCallback(
    (subType: InvestmentSubType): InvestmentPrice | null => {
      const allPrices = [
        ...priceCache.gold,
        ...priceCache.silver,
        ...priceCache.currency,
        ...priceCache.crypto,
        ...priceCache.stocks,
      ];
      return allPrices.find((p) => p.type === subType) || null;
    },
    [priceCache]
  );
 
  const getCurrentValue = useCallback(
    (subType: InvestmentSubType, quantity: number): number => {
      const price = getPrice(subType);
      if (!price) return 0;
      return quantity * price.sellPrice;
    },
    [getPrice]
  );
 
  const isStale = useMemo(() => {
    if (!priceCache.lastFetched) return true;
    return Date.now() - new Date(priceCache.lastFetched).getTime() > CACHE_TTL;
  }, [priceCache.lastFetched]);
 
  const lastFetchedText = useMemo(() => {
    if (!priceCache.lastFetched) return 'Henüz güncellenmedi';
    const diff = Date.now() - new Date(priceCache.lastFetched).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Az önce güncellendi';
    if (mins < 60) return `${mins} dk önce güncellendi`;
    const hours = Math.floor(mins / 60);
    return `${hours} saat önce güncellendi`;
  }, [priceCache.lastFetched]);
 
  return {
    priceCache,
    refreshPrices,
    isRefreshing,
    getPrice,
    getCurrentValue,
    isStale,
    lastFetched: priceCache.lastFetched,
    lastFetchedText,
  };
}
 