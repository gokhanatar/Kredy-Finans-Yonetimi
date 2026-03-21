
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { FinancialHealthCard } from "@/components/FinancialHealthCard";
import { PersonalFinanceSummaryCard } from "@/components/PersonalFinanceSummaryCard";
import { FamilyFinanceSummaryCard } from "@/components/FamilyFinanceSummaryCard";
import { TodaysCardWidget } from "@/components/TodaysCardWidget";
import { QuickActions } from "@/components/QuickActions";
import { QuickAddFAB } from "@/components/QuickAddFAB";
import { HomeSafeToSpend } from "@/components/HomeSafeToSpend";
import { CommercialAnalyticsBanner } from "@/components/CommercialAnalyticsBanner";
import { DebtRollingSimulator } from "@/components/DebtRollingSimulator";
import { RestructuringSimulator } from "@/components/RestructuringSimulator";
import { InstallmentCalculator } from "@/components/InstallmentCalculator";
import { ShoppingForm } from "@/components/ShoppingForm";
import { Onboarding } from "@/components/Onboarding";
import { PermissionSetup } from "@/components/PermissionSetup";
import { OverdueAlert } from "@/components/OverdueAlert";
import { PaymentActionDrawer } from "@/components/PaymentActionDrawer";
import { CreditCard } from "@/types/finance";
import { CreditCard as CreditCardIcon } from "lucide-react";
import {
  calculateFinancialHealth,
  calculateGoldenWindow,
  formatCurrency,
} from "@/lib/financeUtils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useFamilySyncedStorage } from "@/hooks/useFamilySyncedStorage";
import { useNotifications } from "@/hooks/useNotifications";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { useOverdueTracking } from "@/hooks/useOverdueTracking";
import { useLoans } from "@/hooks/useLoans";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { useFamilySync } from "@/contexts/FamilySyncContext";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
 
const Index = () => {
  const { t } = useTranslation(['cards', 'common']);
  const navigate = useNavigate();
 
  const [showSimulator, setShowSimulator] = useState(false);
  const [showRestructuring, setShowRestructuring] = useState(false);
  const [showInstallment, setShowInstallment] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
 
  const { profile } = useUserProfile();
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
 
  // Personal card storage
  const [cards, setCards] = useFamilySyncedStorage<CreditCard[]>("kredi-pusula-cards", [] as CreditCard[]);
 
  // Onboarding
  const { hasCompletedOnboarding, hasCompletedPermissions, isLoading: onboardingLoading, completeOnboarding, completePermissions } = useOnboarding();
 
  // Notifications
  useNotifications(cards);
 
  // Purchase history & transaction log
  const { addPurchase } = usePurchaseHistory();
  const { addEntry: logTransaction } = useTransactionHistory();
 
  // Loans
  const { loans } = useLoans();
 
  // Overdue tracking
  const { summary: overdueSummary, allOverdueItems } = useOverdueTracking({ cards, loans });
 
  const { isConnected } = useFamilySync();
  const hidePersonal = !!isConnected && !!profile.hidePersonalFinance;
  const cardsWithDebt = cards.filter((c) => c.currentDebt > 0);
 
  const handlePayDebtClick = () => {
    if (cardsWithDebt.length === 0) return;
    if (cardsWithDebt.length === 1) {
      setPayingCardId(cardsWithDebt[0].id);
    } else {
      setShowCardPicker(true);
    }
  };
  const financialHealth = calculateFinancialHealth(cards);
  const goldenWindowCards = calculateGoldenWindow(cards);
  const todaysCard = goldenWindowCards[0] || null;
  const hasGoldenWindow = todaysCard !== null && todaysCard.isGoldenWindow;
 
  // Show onboarding if not completed
  if (!onboardingLoading && !hasCompletedOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }
 
  // Show permission setup after onboarding
  if (!onboardingLoading && hasCompletedOnboarding && !hasCompletedPermissions) {
    return <PermissionSetup onComplete={completePermissions} />;
  }
 
  return (
    <div className="min-h-screen bg-background">
      <Header userName={profile.name || t('common:defaultUser')} />
 
      <main className="mx-auto max-w-2xl px-5">
        <div className="space-y-4 pb-safe-nav">
          {/* 1. SafeToSpend */}
          <HomeSafeToSpend />
 
          {/* 2. Vadesi Geçen Uyarı */}
          {overdueSummary.hasOverdue && (
            <OverdueAlert
              overdueItems={allOverdueItems}
              onViewAll={() => navigate('/loans')}
            />
          )}
 
          {/* 3. Bugünün Kartı — golden window aktifse */}
          {hasGoldenWindow && (
            <TodaysCardWidget
              goldenCard={todaysCard}
              onShopClick={() => setShowShopping(true)}
            />
          )}
 
          {/* 4. Ticari Kart Analizi Banner */}
          <CommercialAnalyticsBanner cards={cards} />
 
          {/* 5. Finansal Özet */}
          {isConnected ? (
            hidePersonal ? (
              <FamilyFinanceSummaryCard />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <PersonalFinanceSummaryCard compact />
                <FamilyFinanceSummaryCard compact />
              </div>
            )
          ) : (
            <PersonalFinanceSummaryCard />
          )}
 
          {/* 6. Finansal Sağlık */}
          <FinancialHealthCard health={financialHealth} collapsible defaultCollapsed />
 
          {/* 6.5. AI Insights Mini Card */}
          {isPremium && (
            <button
              onClick={() => navigate('/ai-insights')}
              className="w-full rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 p-4 text-left transition-all hover:from-violet-500/15 hover:via-purple-500/15 hover:to-fuchsia-500/15"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                  <span className="text-lg">🤖</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t('cards:quickActions.aiInsights', { defaultValue: 'AI İçgörüleri' })}</p>
                  <p className="text-xs text-muted-foreground">{t('cards:quickActions.aiInsightsDesc', { defaultValue: 'Harcama trendleri, bütçe önerileri, borç stratejisi' })}</p>
                </div>
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400">PRO</span>
              </div>
            </button>
          )}
 
          {/* 7. Hızlı Aksiyonlar */}
          <QuickActions
            onSimulatorClick={() => setShowSimulator(true)}
            onInstallmentClick={() => setShowInstallment(true)}
            onCardsClick={() => navigate('/wallet?tab=kartlar')}
            onRestructuringClick={() => setShowRestructuring(true)}
            onPayDebtClick={handlePayDebtClick}
          />
        </div>
      </main>
 
      <QuickAddFAB
        onAddExpense={() => navigate(hidePersonal ? '/family' : '/wallet?action=expense')}
        onAddIncome={() => navigate(hidePersonal ? '/family' : '/wallet?action=income')}
        onPayBill={() => navigate(hidePersonal ? '/family' : '/wallet?action=bill')}
      />
 
      <MobileNav activeTab="home" />
 
      {/* Simulator Modal */}
      <Dialog open={showSimulator} onOpenChange={setShowSimulator}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden>
            <DialogTitle>{t('quickActions.debtRolling')}</DialogTitle>
          </VisuallyHidden>
          <DebtRollingSimulator cards={cards} onClose={() => setShowSimulator(false)} />
        </DialogContent>
      </Dialog>
 
      {/* Restructuring Modal */}
      <Dialog open={showRestructuring} onOpenChange={setShowRestructuring}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden>
            <DialogTitle>{t('quickActions.restructuring')}</DialogTitle>
          </VisuallyHidden>
          <RestructuringSimulator onClose={() => setShowRestructuring(false)} />
        </DialogContent>
      </Dialog>
 
      {/* Installment Calculator Modal */}
      <Dialog open={showInstallment} onOpenChange={setShowInstallment}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden>
            <DialogTitle>{t('quickActions.installment')}</DialogTitle>
          </VisuallyHidden>
          <InstallmentCalculator onClose={() => setShowInstallment(false)} />
        </DialogContent>
      </Dialog>
 
      {/* Shopping Form Modal */}
      <Dialog open={showShopping} onOpenChange={setShowShopping}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden>
            <DialogTitle>{t('shopping.title')}</DialogTitle>
          </VisuallyHidden>
          <ShoppingForm
            cards={cards}
            selectedCardId={todaysCard?.card.id}
            onClose={() => setShowShopping(false)}
            onViewHistory={() => { setShowShopping(false); navigate('/purchases'); }}
            onSubmit={(purchase) => {
              addPurchase(purchase);
              logTransaction({
                type: 'purchase',
                title: purchase.description,
                description: purchase.merchant || undefined,
                amount: purchase.amount,
                category: purchase.category,
                date: purchase.date,
              });
              setCards((prev) =>
                prev.map((c) =>
                  c.id === purchase.cardId
                    ? { ...c, currentDebt: c.currentDebt + purchase.amount }
                    : c
                )
              );
            }}
          />
        </DialogContent>
      </Dialog>
      {/* Card Picker Drawer */}
      <Drawer open={showCardPicker} onOpenChange={setShowCardPicker}>
        <DrawerContent>
          <VisuallyHidden>
            <DrawerTitle>{t('quickActions.selectCard')}</DrawerTitle>
          </VisuallyHidden>
          <div className="space-y-2 p-4 pb-safe-nav">
            <p className="text-sm font-semibold text-center mb-3">
              {t('quickActions.selectCard')}
            </p>
            {cardsWithDebt.map((card) => (
              <button
                key={card.id}
                onClick={() => {
                  setShowCardPicker(false);
                  setPayingCardId(card.id);
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-secondary/50 p-3 text-left transition-colors hover:bg-secondary"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${card.color}`}>
                  <CreditCardIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{card.bankName} {card.cardName}</p>
                  <p className="text-xs text-muted-foreground">•••• {card.lastFourDigits}</p>
                </div>
                <p className="text-sm font-bold text-destructive">{formatCurrency(card.currentDebt)}</p>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
 
      {/* Payment Action Drawer */}
      <PaymentActionDrawer
        open={payingCardId !== null}
        onOpenChange={(open) => { if (!open) setPayingCardId(null); }}
        assetType="card"
        assetId={payingCardId}
        onPaymentComplete={() => {
          setPayingCardId(null);
          try {
            const stored = window.localStorage.getItem('kredi-pusula-cards');
            if (stored) setCards(JSON.parse(stored));
          } catch { /* ignore */ }
        }}
      />
    </div>
  );
};
 
export default Index;
 