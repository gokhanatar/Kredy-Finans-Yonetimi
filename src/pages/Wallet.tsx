
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { QuickAddFAB } from '@/components/QuickAddFAB';
import { TrialBanner } from '@/components/finance/TrialBanner';
import { FinanceContent, type FinansSubTab } from '@/components/finance/FinanceContent';
import { CreditCardWidget } from '@/components/CreditCardWidget';
import { CardForm } from '@/components/CardForm';
import { ShoppingForm } from '@/components/ShoppingForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CreditCard } from '@/types/finance';
import { PurchaseData } from '@/types/purchase';
import { calculateGoldenWindow } from '@/lib/financeUtils';
import { toast } from '@/hooks/use-toast';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { LimitGate } from '@/components/LimitGate';
import { PaymentActionDrawer } from '@/components/PaymentActionDrawer';
import { CardStatementDrawer } from '@/components/installments';
import { useCardInstallments } from '@/hooks/useCardInstallments';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFamilySync } from '@/contexts/FamilySyncContext';
 
type WalletTab = 'hesaplar' | 'kartlar' | 'borclar' | 'butce';
 
const WALLET_TABS: { id: WalletTab; labelKey: string }[] = [
  { id: 'hesaplar', labelKey: 'wallet.tabs.accounts' },
  { id: 'kartlar', labelKey: 'wallet.tabs.cards' },
  { id: 'borclar', labelKey: 'wallet.tabs.debts' },
  { id: 'butce', labelKey: 'wallet.tabs.budget' },
];
 
// Map wallet tabs to FinanceContent sub-tabs
const FINANCE_SUB_TAB_MAP: Partial<Record<WalletTab, FinansSubTab>> = {
  hesaplar: 'ozet',
  borclar: 'duzenli-odemeler',
  butce: 'butce-hedefler',
};
 
const Wallet = () => {
  const { t } = useTranslation(['cards', 'finance', 'common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as WalletTab) || 'hesaplar';
  const [activeTab, setActiveTab] = useState<WalletTab>(initialTab);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const { profile } = useUserProfile();
  const { familyId } = useFamilySync();
 
  // Handle URL action param from FAB navigation
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'expense' || action === 'income') {
      setActiveTab('hesaplar');
      setPendingAction(action);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'bill') {
      setActiveTab('borclar');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);
 
  // Card management state
  const [cards, setCards] = useFamilySyncedStorage<CreditCard[]>('kredi-pusula-cards', [] as CreditCard[]);
  const [familyCards, setFamilyCards] = useFamilySyncedStorage<CreditCard[]>('kredi-pusula-family-cards', [] as CreditCard[]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>(undefined);
  const [showShopping, setShowShopping] = useState(false);
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const [statementCard, setStatementCard] = useState<CreditCard | null>(null);
 
  const { addPurchase } = usePurchaseHistory();
  const { addEntry: logTransaction } = useTransactionHistory();
  const { deleteInstallmentsByCard } = useCardInstallments();
 
  // Kisisel finans gizliyse → family'ye yonlendir (hook'lardan SONRA)
  if (familyId && profile.hidePersonalFinance) {
    return <Navigate to="/family" replace />;
  }
 
  const goldenWindowCards = calculateGoldenWindow(cards);
  const todaysCard = goldenWindowCards[0] || null;
 
  // Card CRUD
  const handleAddCard = (card: CreditCard) => {
    setCards((prev) => [...prev, card]);
    if (card.sharedWithFamily) {
      setFamilyCards((prev) => [...prev, card]);
    }
    setShowCardForm(false);
    setEditingCard(undefined);
    toast({ title: t('cardAdded'), description: t('cardAddedDesc', { name: `${card.bankName} ${card.cardName}` }) });
  };
 
  const handleUpdateCard = (updatedCard: CreditCard) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    if (updatedCard.sharedWithFamily) {
      setFamilyCards((prev) => {
        const exists = prev.some((c) => c.id === updatedCard.id);
        return exists ? prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)) : [...prev, updatedCard];
      });
    } else {
      setFamilyCards((prev) => prev.filter((c) => c.id !== updatedCard.id));
    }
    setShowCardForm(false);
    setEditingCard(undefined);
    toast({ title: t('cardUpdated'), description: t('cardUpdatedDesc', { name: `${updatedCard.bankName} ${updatedCard.cardName}` }) });
  };
 
  const handleDeleteCard = (cardId: string) => {
    const cardToDelete = cards.find((c) => c.id === cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setFamilyCards((prev) => prev.filter((c) => c.id !== cardId));
    deleteInstallmentsByCard(cardId);
    setShowCardForm(false);
    setEditingCard(undefined);
    setStatementCard(null);
    toast({ title: t('cardDeleted'), description: t('cardDeletedDesc', { name: `${cardToDelete?.bankName} ${cardToDelete?.cardName}` }), variant: 'destructive' });
  };
 
  const renderCards = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('title')}</h2>
        <LimitGate limitKey="CARDS" currentCount={cards.length} onAllowed={() => { setEditingCard(undefined); setShowCardForm(true); }}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('addCard')}
          </Button>
        </LimitGate>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('cardsRegistered', { count: cards.length })}
      </p>
      {goldenWindowCards.map((gw) => (
        <CreditCardWidget
          key={gw.card.id}
          card={gw.card}
          isGoldenWindow={gw.isGoldenWindow}
          goldenRating={gw.goldenRating}
          goldenDaysRemaining={gw.goldenDaysRemaining}
          recommendation={gw.recommendation}
          onClick={() => setStatementCard(gw.card)}
          onPayClick={() => setPayingCardId(gw.card.id)}
        />
      ))}
      {cards.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/30 py-12">
          <p className="text-muted-foreground">{t('noCards')}</p>
          <Button onClick={() => { setEditingCard(undefined); setShowCardForm(true); }} variant="link" className="mt-2">
            {t('addFirstCard')}
          </Button>
        </div>
      )}
    </div>
  );
 
  const financeSubTab = FINANCE_SUB_TAB_MAP[activeTab];
 
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-2xl">
          <div className="flex h-14 items-center gap-4 px-4">
            <h1 className="text-lg font-semibold">{t('finance:wallet.title', 'Cüzdan')}</h1>
          </div>
 
          <TrialBanner />
 
          {/* Tab navigation */}
          <div className="px-4">
            <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
              {WALLET_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {t(`finance:${tab.labelKey}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
 
      <main className="mx-auto max-w-2xl px-5 py-4 pb-safe-nav">
        {activeTab === 'kartlar' ? (
          renderCards()
        ) : financeSubTab ? (
          <FinanceContent
            scope="personal"
            activeSubTab={financeSubTab}
            onActiveSubTabChange={() => {}}
            pendingAction={pendingAction}
            onActionHandled={() => setPendingAction(null)}
          />
        ) : null}
      </main>
 
      <QuickAddFAB
        onAddExpense={() => { setActiveTab('hesaplar'); setPendingAction('expense'); }}
        onAddIncome={() => { setActiveTab('hesaplar'); setPendingAction('income'); }}
        onPayBill={() => setActiveTab('borclar')}
      />
 
      <MobileNav activeTab="wallet" />
 
      {/* Card Form Modal */}
      <Dialog open={showCardForm} onOpenChange={(open) => {
        setShowCardForm(open);
        if (!open) setEditingCard(undefined);
      }}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden>
            <DialogTitle>{editingCard ? t('editCard') : t('newCard')}</DialogTitle>
          </VisuallyHidden>
          <CardForm
            card={editingCard}
            onSubmit={editingCard ? handleUpdateCard : handleAddCard}
            onDelete={editingCard ? handleDeleteCard : undefined}
            onClose={() => { setShowCardForm(false); setEditingCard(undefined); }}
          />
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
 
      {/* Card Statement Drawer */}
      {statementCard && (
        <CardStatementDrawer
          open={!!statementCard}
          onOpenChange={(open) => { if (!open) setStatementCard(null); }}
          card={statementCard}
          onEditCard={() => {
            setEditingCard(statementCard);
            setStatementCard(null);
            setShowCardForm(true);
          }}
          onPayClick={() => {
            setPayingCardId(statementCard.id);
            setStatementCard(null);
          }}
        />
      )}
 
      {/* Payment Action Drawer */}
      <PaymentActionDrawer
        open={payingCardId !== null}
        onOpenChange={(open) => { if (!open) setPayingCardId(null); }}
        assetType="card"
        assetId={payingCardId}
        onPaymentComplete={() => {
          setPayingCardId(null);
          // useCardPayment wrote to the same localStorage key — re-read to sync Wallet's state
          try {
            const stored = window.localStorage.getItem('kredi-pusula-cards');
            if (stored) setCards(JSON.parse(stored));
          } catch { /* ignore */ }
        }}
      />
 
    </div>
  );
};
 
export default Wallet;
 