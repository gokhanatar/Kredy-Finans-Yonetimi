import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { TrialBanner } from '@/components/finance/TrialBanner';
import { FinanceContent, FINANS_TAB_IDS, type FinansSubTab } from '@/components/finance/FinanceContent';
import { QuickAddFAB } from '@/components/QuickAddFAB';

// ─── Sub-tab translation keys ───────────────────────────────────

const SUB_TAB_KEYS: Record<FinansSubTab, string> = {
  ozet: 'tabs.summary',
  'gelir-gider': 'tabs.incomeExpense',
  'duzenli-odemeler': 'tabs.regularPayments',
  'butce-hedefler': 'tabs.budgetGoals',
  hesaplar: 'tabs.accounts',
};

// ─── Main component ─────────────────────────────────────────────

const Finance = () => {
  const { t } = useTranslation(['family', 'finance', 'common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [finansTab, setFinansTab] = useState<FinansSubTab>('ozet');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Handle URL action param from FAB navigation
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'expense' || action === 'income') {
      setFinansTab('gelir-gider');
      setPendingAction(action);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'bill') {
      setFinansTab('duzenli-odemeler');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="page-container">
          <div className="flex h-14 items-center gap-4 px-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">{t('personalTitle', 'Kişisel Finansım')}</h1>
          </div>

          {/* Trial / Premium Banner */}
          <TrialBanner />

          {/* Sub-tab navigation */}
          <div className="px-4">
            <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
              {FINANS_TAB_IDS.map((tabId) => (
                <button
                  key={tabId}
                  onClick={() => setFinansTab(tabId)}
                  className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    finansTab === tabId
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {t(SUB_TAB_KEYS[tabId])}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="page-container py-4 pb-safe-nav lg:pb-6">
        <FinanceContent
          scope="personal"
          activeSubTab={finansTab}
          onActiveSubTabChange={setFinansTab}
          pendingAction={pendingAction}
          onActionHandled={() => setPendingAction(null)}
        />
      </main>

      <QuickAddFAB
        onAddExpense={() => { setFinansTab('gelir-gider'); setPendingAction('expense'); }}
        onAddIncome={() => { setFinansTab('gelir-gider'); setPendingAction('income'); }}
        onPayBill={() => { setFinansTab('duzenli-odemeler'); }}
      />


    </div>
  );
};

export default Finance;
