
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, TrendingUp } from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { FamilySyncSetup } from '@/components/FamilySyncSetup';
import { DebtRollingSimulator } from '@/components/DebtRollingSimulator';
import { RestructuringSimulator } from '@/components/RestructuringSimulator';
import { InstallmentCalculator } from '@/components/InstallmentCalculator';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { useSimpleMode } from '@/contexts/SimpleModeContext';
import { CreditCard } from '@/types/finance';
 
const Menu = () => {
  const { t } = useTranslation(['cards', 'common']);
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { isPremium, isTrialActive, trialDaysLeft, subscriptionPlan, isScreenshotMode } = useSubscriptionContext();
  const [cards] = useFamilySyncedStorage<CreditCard[]>('kredi-pusula-cards', [] as CreditCard[]);
 
  const { isSimpleMode, toggleSimpleMode } = useSimpleMode();
  const [showSimulator, setShowSimulator] = useState(false);
  const [showRestructuring, setShowRestructuring] = useState(false);
  const [showInstallment, setShowInstallment] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
 
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-2xl">
          <div className="flex h-14 items-center gap-4 px-4">
            <h1 className="text-lg font-semibold">{t('common:nav.menu', 'Menü')}</h1>
          </div>
        </div>
      </div>
 
      <main className="mx-auto max-w-2xl px-5 py-4 pb-safe-nav">
        <div className="space-y-4">
          {/* 1. Kompakt kullanıcı kartı */}
          <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
            <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">
                {(profile.name || "K").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{profile.name || t('common:defaultUser')}</h2>
              <p className="text-sm text-muted-foreground truncate">{profile.email || t('profile.settingsEmail')}</p>
            </div>
            {isPremium && !isTrialActive && !isScreenshotMode && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-warning to-amber-500 px-2.5 py-1 text-[10px] font-bold text-white">
                <Crown className="h-3 w-3" /> PRO
              </span>
            )}
            {isTrialActive && !isScreenshotMode && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/80 px-2.5 py-1 text-[10px] font-bold text-white">
                {trialDaysLeft} {t('common:time.days', { defaultValue: 'gün' })}
              </span>
            )}
          </div>
 
          {/* 2. PRO upgrade banner — free ve trial kullanıcılarına göster */}
          {(!isPremium || isTrialActive) && !isScreenshotMode && (
            <button
              onClick={() => setShowPaywall(true)}
              className="w-full overflow-hidden rounded-2xl bg-gradient-to-r from-warning via-amber-500 to-orange-500 p-4 shadow-lg transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-white">{t('profile.goPremium')}</p>
                  <p className="text-xs text-white/80">{t('profile.goPremiumDesc')}</p>
                </div>
                <span className="text-white/90 text-lg">→</span>
              </div>
            </button>
          )}
 
          {/* 3. Aile Paylaşımı */}
          <FamilySyncSetup />
 
          {/* 3.5 Basit Mod Toggle */}
          <button
            onClick={() => {
              toggleSimpleMode();
              if (!isSimpleMode) {
                // Switching TO simple mode — navigate to simple summary
                setTimeout(() => navigate('/'), 50);
              }
            }}
            className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{isSimpleMode ? '🔓' : '✨'}</span>
              <div className="text-left">
                <p className="font-medium text-sm">{isSimpleMode ? 'Detaylı Mod' : 'Basit Mod'}</p>
                <p className="text-xs text-muted-foreground">
                  {isSimpleMode ? 'Tüm sekmeleri ve detayları aç' : 'Daha az sekme, daha sade arayüz'}
                </p>
              </div>
            </div>
            <div
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isSimpleMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  isSimpleMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
 
          {/* 4. VARLIKLARIM bölümü */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.myAssets')}</p>
            <button
              onClick={() => navigate('/wallet?tab=kartlar')}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-sky-500/10 to-sky-600/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-sky-600">💳</span> {t('profile.myCards')}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => navigate('/investments')}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" /> {t('profile.investmentPortfolio')}
                {!isPremium && !isScreenshotMode && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Crown className="h-2 w-2" />PRO
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => navigate('/assets')}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-green-600">🏠</span> {t('profile.assetManagement')}
                {!isPremium && !isScreenshotMode && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Crown className="h-2 w-2" />PRO
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
 
          {/* 5. ARAÇLAR bölümü */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.tools')}</p>
            <button
              onClick={() => navigate('/loans')}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-blue-600">🏦</span> {t('profile.loanSimulator')}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => setShowSimulator(true)}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-orange-600">🔄</span> {t('profile.debtRollingSimulator')}
                {!isPremium && !isScreenshotMode && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Crown className="h-2 w-2" />PRO
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => setShowRestructuring(true)}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-600/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-purple-600">📋</span> {t('profile.restructuringSimulator')}
                {!isPremium && !isScreenshotMode && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Crown className="h-2 w-2" />PRO
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => setShowInstallment(true)}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-cyan-500/10 to-cyan-600/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-cyan-600">🧮</span> {t('profile.installmentCalculator')}
                {!isPremium && !isScreenshotMode && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Crown className="h-2 w-2" />PRO
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => navigate('/commercial-analytics')}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-primary">🏢</span> {t('profile.commercialAnalysis')}
                {!isPremium && !isScreenshotMode && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Crown className="h-2 w-2" />PRO
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
 
          {/* 6. UYGULAMA bölümü */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.application')}</p>
            <button
              onClick={() => navigate('/widgets')}
              className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/5 p-4 shadow-soft"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-violet-600">🧩</span> {t('profile.widgetGallery')}
                {!isPremium && !isScreenshotMode && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Crown className="h-2 w-2" />PRO
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft"
            >
              <span className="font-medium">🔔 {t('profile.notificationPrefs')}</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => navigate('/purchases')}
              className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft"
            >
              <span className="font-medium">📊 {t('profile.purchaseHistory')}</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft"
            >
              <span className="font-medium">⚙️ {t('profile.accountSettings')}</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => navigate('/help')}
              className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft"
            >
              <span className="font-medium">❓ {t('profile.helpSupport')}</span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
        </div>
      </main>
 
      <MobileNav activeTab="menu" />
 
      {/* Simulator Modal */}
      <Dialog open={showSimulator} onOpenChange={setShowSimulator}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('quickActions.debtRolling')}</DialogTitle>
          </VisuallyHidden>
          <PremiumLockOverlay showFloatingButton={false}>
            <DebtRollingSimulator
              cards={cards}
              onClose={() => setShowSimulator(false)}
            />
          </PremiumLockOverlay>
        </DialogContent>
      </Dialog>
 
      {/* Restructuring Modal */}
      <Dialog open={showRestructuring} onOpenChange={setShowRestructuring}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('quickActions.restructuring')}</DialogTitle>
          </VisuallyHidden>
          <PremiumLockOverlay showFloatingButton={false}>
            <RestructuringSimulator onClose={() => setShowRestructuring(false)} />
          </PremiumLockOverlay>
        </DialogContent>
      </Dialog>
 
      {/* Installment Calculator Modal */}
      <Dialog open={showInstallment} onOpenChange={setShowInstallment}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('quickActions.installment')}</DialogTitle>
          </VisuallyHidden>
          <PremiumLockOverlay showFloatingButton={false}>
            <InstallmentCalculator onClose={() => setShowInstallment(false)} />
          </PremiumLockOverlay>
        </DialogContent>
      </Dialog>
 
      {/* Paywall Dialog */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('profile.goPremium')}</DialogTitle>
          </VisuallyHidden>
          <SubscriptionPaywall
            onClose={() => setShowPaywall(false)}
            showCloseButton={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
 
export default Menu;
 