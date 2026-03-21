
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
414
415
416
417
418
419
420
421
422
423
424
425
426
427
428
429
430
431
432
433
434
435
436
437
438
439
440
441
442
443 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowLeft, Filter, Trash2, ShoppingBag, Search, History, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/financeUtils';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { useTransactionHistory, type TransactionType } from '@/hooks/useTransactionHistory';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CreditCard } from '@/types/finance';
import { CATEGORIES } from '@/types/purchase';
import { CategoryIcon } from '@/components/ui/category-icon';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
 
type ActiveTab = 'purchases' | 'history';
 
const TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Gelir',
  expense: 'Gider',
  card_payment: 'Kart Ödeme',
  purchase: 'Alışveriş',
  simulator: 'Simülasyon',
  investment: 'Yatırım',
  goal: 'Hedef',
  transfer: 'Transfer',
};
 
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
  income: 'text-success bg-success/10',
  expense: 'text-destructive bg-destructive/10',
  card_payment: 'text-primary bg-primary/10',
  purchase: 'text-amber-600 bg-amber-500/10',
  simulator: 'text-blue-600 bg-blue-500/10',
  investment: 'text-violet-600 bg-violet-500/10',
  goal: 'text-teal-600 bg-teal-500/10',
  transfer: 'text-orange-600 bg-orange-500/10',
};
 
export default function PurchaseHistory() {
  const navigate = useNavigate();
  const { t } = useTranslation(['cards', 'common']);
  const { purchases, deletePurchase, getTotalSpentThisMonth } = usePurchaseHistory();
  const { history, deleteEntry, clearHistory } = useTransactionHistory();
  const [cards] = useLocalStorage<CreditCard[]>('kredi-pusula-cards', [] as CreditCard[]);
 
  const [activeTab, setActiveTab] = useState<ActiveTab>('purchases');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cardFilter, setCardFilter] = useState<string>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
 
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchesSearch = purchase.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || purchase.category === categoryFilter;
      const matchesCard = cardFilter === 'all' || purchase.cardId === cardFilter;
      return matchesSearch && matchesCategory && matchesCard;
    });
  }, [purchases, searchTerm, categoryFilter, cardFilter]);
 
  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const matchesSearch = entry.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = historyTypeFilter === 'all' || entry.type === historyTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [history, searchTerm, historyTypeFilter]);
 
  const getCardName = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    return card ? `${card.bankName} ${card.cardName}` : t('common:unknown');
  };
 
  const getCategoryInfo = (categoryValue: string) => {
    return CATEGORIES.find((c) => c.value === categoryValue) || { icon: 'package', label: t('common:other') };
  };
 
  const totalFiltered = filteredPurchases.reduce((sum, p) => sum + p.amount, 0);
 
  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {activeTab === 'purchases' ? t('purchases.title') : 'İşlem Geçmişi'}
            </h1>
            {activeTab === 'purchases' && (
              <p className="text-sm text-muted-foreground">
                Bu ay: {formatCurrency(getTotalSpentThisMonth())}
              </p>
            )}
          </div>
        </div>
 
        {/* Tab Switcher */}
        <div className="flex gap-1 px-4 pb-3">
          <button
            onClick={() => setActiveTab('purchases')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-all',
              activeTab === 'purchases'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            {t('purchases.title', { defaultValue: 'Harcamalar' })}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-all',
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            <History className="h-4 w-4" />
            Geçmiş
          </button>
        </div>
 
        {/* Filters */}
        <div className="space-y-3 px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('purchases.searchPlaceholder', { defaultValue: 'Ara...' })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
 
          {activeTab === 'purchases' ? (
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('purchases.allCategories')}</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <CategoryIcon name={cat.icon} size={16} className="inline-block mr-1" />{cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
 
              <Select value={cardFilter} onValueChange={setCardFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Kart" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('purchases.allCards')}</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.bankName} •{card.lastFourDigits}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                <SelectTrigger className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tüm İşlemler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İşlemler</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {TYPE_ICONS[key as TransactionType]} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {history.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Geçmişi Temizle</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tüm işlem geçmişi silinecek. Bu işlem geri alınamaz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearHistory}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('common:actions.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </div>
 
      {activeTab === 'purchases' ? (
        <>
          {/* Summary */}
          {filteredPurchases.length > 0 && (
            <div className="mx-4 mt-4 rounded-xl bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('purchases.shown', { count: filteredPurchases.length })}
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(totalFiltered)}
                </span>
              </div>
            </div>
          )}
 
          {/* Purchase List */}
          <div className="mt-4 space-y-2 px-4">
            {filteredPurchases.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/30 py-16">
                <ShoppingBag className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">{t('purchases.noPurchases')}</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => navigate('/')}
                >
                  {t('purchases.addPurchase')}
                </Button>
              </div>
            ) : (
              filteredPurchases.map((purchase) => {
                const categoryInfo = getCategoryInfo(purchase.category);
                return (
                  <div
                    key={purchase.id}
                    className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-soft"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                      <CategoryIcon name={categoryInfo.icon} size={24} />
                    </div>
 
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {purchase.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {purchase.merchant && <span className="text-foreground">{purchase.merchant} • </span>}
                        {getCardName(purchase.cardId)} • {format(new Date(purchase.date), 'd MMM yyyy', { locale: tr })}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {purchase.installments > 1 && (
                          <span className="text-xs text-primary">
                            {t('purchases.installmentFormat', { count: purchase.installments })} × {formatCurrency(purchase.monthlyPayment)}
                          </span>
                        )}
                        {purchase.isDeferred && purchase.deferredMonths > 0 && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                            {t('purchases.deferredFormat', { months: purchase.deferredMonths })}
                          </span>
                        )}
                      </div>
                    </div>
 
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(purchase.amount)}
                      </p>
                      {purchase.installments > 1 && purchase.totalAmount > purchase.amount && (
                        <p className="text-xs text-muted-foreground">
                          {t('common:total')}: {formatCurrency(purchase.totalAmount)}
                        </p>
                      )}
                    </div>
 
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('purchases.deleteTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('purchases.deleteConfirm')}
                            {' '}{t('common:confirm.cannotUndo')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePurchase(purchase.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('common:actions.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Transaction History Tab */
        <div className="mt-4 space-y-2 px-4">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/30 py-16">
              <History className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Henüz işlem geçmişi yok</p>
              <p className="text-xs text-muted-foreground mt-1">İşlemleriniz otomatik olarak kaydedilecek</p>
            </div>
          ) : (
            filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-xl bg-card p-3.5 shadow-soft"
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl text-xl',
                  TYPE_COLORS[entry.type]
                )}>
                  {TYPE_ICONS[entry.type]}
                </div>
 
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{entry.title}</p>
                    <span className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                      TYPE_COLORS[entry.type]
                    )}>
                      {TYPE_LABELS[entry.type]}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(entry.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
 
                {entry.amount !== undefined && (
                  <div className="text-right shrink-0">
                    <p className={cn(
                      'font-semibold text-sm',
                      entry.type === 'income' ? 'text-success' : 'text-foreground'
                    )}>
                      {entry.type === 'income' ? '+' : ''}{formatCurrency(entry.amount)}
                    </p>
                  </div>
                )}
 
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>İşlemi Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu işlem geçmişten silinecek. Geri alınamaz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteEntry(entry.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('common:actions.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
 