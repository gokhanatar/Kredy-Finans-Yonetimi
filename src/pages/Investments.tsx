
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { MobileNav } from '@/components/MobileNav';
import { InvestmentPricesProvider, useInvestmentPricesContext } from '@/contexts/InvestmentPricesContext';
import { useInvestments } from '@/hooks/useInvestments';
import { InvestmentForm } from '@/components/investment/InvestmentForm';
import { InvestmentList } from '@/components/investment/InvestmentList';
import { PortfolioSummary } from '@/components/investment/PortfolioSummary';
import { PortfolioPieChart } from '@/components/investment/PortfolioPieChart';
import { PriceRefreshButton } from '@/components/investment/PriceRefreshButton';
import {
  Investment,
  InvestmentCategory,
  INVESTMENT_CATEGORY_LABEL_KEYS,
  INVESTMENT_CATEGORY_EMOJIS,
} from '@/types/investment';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
 
type SubTab = 'portfoy' | 'altin' | 'doviz' | 'hisse' | 'kripto';
 
const SUB_TAB_IDS: SubTab[] = ['portfoy', 'altin', 'doviz', 'hisse', 'kripto'];
const SUB_TAB_KEYS: Record<SubTab, string> = {
  portfoy: 'tabs.portfolio',
  altin: 'tabs.gold',
  doviz: 'tabs.currency',
  hisse: 'tabs.stocks',
  kripto: 'tabs.crypto',
};
 
const TAB_TO_CATEGORIES: Record<SubTab, InvestmentCategory[]> = {
  portfoy: [],
  altin: ['altin', 'gumus'],
  doviz: ['doviz'],
  hisse: ['hisse'],
  kripto: ['kripto'],
};
 
function InvestmentContent() {
  const { t } = useTranslation(['investments', 'common']);
  const navigate = useNavigate();
  const { investments, investmentsByCategory, addInvestment, updateInvestment, deleteInvestment } = useInvestments();
  const { refreshPrices, isRefreshing, lastFetchedText } = useInvestmentPricesContext();
 
  const [activeTab, setActiveTab] = useState<SubTab>('portfoy');
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState<InvestmentCategory | undefined>();
  const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>();
 
  const openAddForm = (category?: InvestmentCategory) => {
    setFormCategory(category);
    setEditingInvestment(undefined);
    setShowForm(true);
  };
 
  const openEditForm = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormCategory(investment.category);
    setShowForm(true);
  };
 
  const handleSubmit = (data: Omit<Investment, 'id' | 'createdAt'>) => {
    if (editingInvestment) {
      updateInvestment(editingInvestment.id, data);
      toast({ title: t('updated'), description: t('updatedDesc') });
    } else {
      addInvestment(data);
      toast({ title: t('added'), description: t('addedDesc') });
    }
    setShowForm(false);
    setEditingInvestment(undefined);
  };
 
  const handleDelete = (id: string) => {
    deleteInvestment(id);
    toast({ title: t('deleted'), description: t('deletedDesc'), variant: 'destructive' });
  };
 
  const getTabInvestments = (tab: SubTab): Investment[] => {
    const categories = TAB_TO_CATEGORIES[tab];
    if (categories.length === 0) return investments;
    return investments.filter((inv) => categories.includes(inv.category));
  };
 
  const renderTabContent = () => {
    if (activeTab === 'portfoy') {
      return (
        <div className="space-y-4">
          <PriceRefreshButton
            onRefresh={refreshPrices}
            isRefreshing={isRefreshing}
            lastFetchedText={lastFetchedText}
          />
          <PortfolioSummary investments={investments} />
          {investments.length > 0 && <PortfolioPieChart investments={investments} />}
 
          {investments.length > 0 && (
            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <h3 className="font-semibold text-sm mb-3">{t('quickAdd')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(INVESTMENT_CATEGORY_LABEL_KEYS) as InvestmentCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => openAddForm(cat)}
                    className="flex flex-col items-center gap-1 rounded-xl bg-secondary/50 p-3 text-center transition-all hover:bg-secondary"
                  >
                    <span className="text-xl">{INVESTMENT_CATEGORY_EMOJIS[cat]}</span>
                    <span className="text-[10px] font-medium">{t(INVESTMENT_CATEGORY_LABEL_KEYS[cat])}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
 
          {investments.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="grid grid-cols-3 gap-3 w-full">
                {(Object.keys(INVESTMENT_CATEGORY_LABEL_KEYS) as InvestmentCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => openAddForm(cat)}
                    className="flex flex-col items-center gap-2 rounded-xl bg-secondary/50 p-4 text-center transition-all hover:bg-secondary hover:shadow-md"
                  >
                    <span className="text-2xl">{INVESTMENT_CATEGORY_EMOJIS[cat]}</span>
                    <span className="text-xs font-medium">{t(INVESTMENT_CATEGORY_LABEL_KEYS[cat])}</span>
                  </button>
                ))}
              </div>
              <Button onClick={() => openAddForm()} className="w-full gap-2" size="lg">
                <Plus className="h-4 w-4" />
                {t('addFirst')}
              </Button>
            </div>
          )}
        </div>
      );
    }
 
    const tabInvestments = getTabInvestments(activeTab);
    const categories = TAB_TO_CATEGORIES[activeTab];
    const primaryCategory = categories[0] as InvestmentCategory | undefined;
 
    return (
      <div className="space-y-4">
        <PriceRefreshButton
          onRefresh={refreshPrices}
          isRefreshing={isRefreshing}
          lastFetchedText={lastFetchedText}
        />
 
        {categories.length > 1 ? (
          categories.map((cat) => {
            const catInvestments = investmentsByCategory[cat] || [];
            return (
              <div key={cat}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  {INVESTMENT_CATEGORY_EMOJIS[cat]} {t(INVESTMENT_CATEGORY_LABEL_KEYS[cat])}
                </h3>
                <InvestmentList
                  investments={catInvestments}
                  category={cat}
                  onAdd={() => openAddForm(cat)}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                />
              </div>
            );
          })
        ) : primaryCategory ? (
          <InvestmentList
            investments={tabInvestments}
            category={primaryCategory}
            onAdd={() => openAddForm(primaryCategory)}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        ) : null}
      </div>
    );
  };
 
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('title')}</h1>
        </div>
 
        {/* Sub-tabs */}
        <div className="flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-none">
          {SUB_TAB_IDS.map((tabId) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                activeTab === tabId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {t(SUB_TAB_KEYS[tabId])}
              {tabId !== 'portfoy' && getTabInvestments(tabId).length > 0 && (
                <span className="ml-1.5 text-xs opacity-70">
                  {getTabInvestments(tabId).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
 
      <main className="p-4 pb-safe-nav space-y-4">
        {/* FREE: Portfolio summary (only on portfoy tab) */}
        {activeTab === 'portfoy' && (
          <>
            <PortfolioSummary investments={investments} />
            {investments.length > 0 && <PortfolioPieChart investments={investments} />}
          </>
        )}
 
        {/* LOCKED: All actionable content */}
        <PremiumLockOverlay>
          {renderTabContent()}
        </PremiumLockOverlay>
      </main>
 
      <MobileNav activeTab="home" />
 
      {/* Add/Edit Form Modal */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingInvestment(undefined);
            setFormCategory(undefined);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden>
            <DialogTitle>{editingInvestment ? t('editInvestment') : t('addInvestment')}</DialogTitle>
          </VisuallyHidden>
          <InvestmentForm
            preselectedCategory={formCategory}
            editingInvestment={editingInvestment}
            onSubmit={handleSubmit}
            onClose={() => {
              setShowForm(false);
              setEditingInvestment(undefined);
              setFormCategory(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
 
const Investments = () => {
  return (
    <ErrorBoundary>
      <InvestmentPricesProvider>
        <InvestmentContent />
      </InvestmentPricesProvider>
    </ErrorBoundary>
  );
};
 
export default Investments;
 