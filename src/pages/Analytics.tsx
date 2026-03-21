
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MobileNav } from '@/components/MobileNav';
import { PaymentCalendar } from '@/components/PaymentCalendar';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';
import { FinancialHealthCard } from '@/components/FinancialHealthCard';
import { TransactionSummary } from '@/components/family/TransactionSummary';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { useTransactions } from '@/hooks/useTransactions';
import { CreditCard } from '@/types/finance';
import { PERSONAL_STORAGE_KEYS } from '@/types/familyFinance';
import { calculateFinancialHealth } from '@/lib/financeUtils';
 
type AnalyticsTab = 'grafikler' | 'takvim';
 
const ANALYTICS_TABS: { id: AnalyticsTab; labelKey: string }[] = [
  { id: 'grafikler', labelKey: 'analytics.tabs.charts' },
  { id: 'takvim', labelKey: 'analytics.tabs.calendar' },
];
 
const Analytics = () => {
  const { t } = useTranslation(['finance', 'cards', 'common']);
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AnalyticsTab) || 'grafikler';
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(initialTab);
 
  const [cards] = useFamilySyncedStorage<CreditCard[]>('kredi-pusula-cards', [] as CreditCard[]);
  const txHook = useTransactions(PERSONAL_STORAGE_KEYS.TRANSACTIONS);
  const financialHealth = calculateFinancialHealth(cards);
 
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-2xl">
          <div className="flex h-14 items-center gap-4 px-4">
            <h1 className="text-lg font-semibold">{t('analytics.title', 'Analiz')}</h1>
          </div>
 
          {/* Tab navigation */}
          <div className="px-4">
            <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
              {ANALYTICS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
 
      <main className="mx-auto max-w-2xl px-5 py-4 pb-safe-nav">
        {activeTab === 'grafikler' ? (
          <div className="space-y-4">
            {/* Transaction Summary */}
            <TransactionSummary
              income={txHook.monthlyTotals.income}
              expense={txHook.monthlyTotals.expense}
              categoryBreakdown={txHook.categoryBreakdown}
            />
 
            {/* Financial Health */}
            <FinancialHealthCard health={financialHealth} />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Payment Calendar — haftalık şerit + yaklaşan ödemeler */}
            <PaymentCalendar cards={cards} />
 
            {/* Monthly Calendar — ay grid + altın pencere + hesap kesim + son ödeme */}
            <MonthlyCalendar cards={cards} />
          </div>
        )}
      </main>
 
      <MobileNav activeTab="analytics" />
    </div>
  );
};
 
export default Analytics;
 