import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown } from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { TrialBanner } from '@/components/finance/TrialBanner';
import { FinanceContent, FINANS_TAB_IDS, type FinansSubTab } from '@/components/finance/FinanceContent';
import { QuickAddFAB } from '@/components/QuickAddFAB';

const VarliklarContent = lazy(() =>
  import('@/components/finance/VarliklarContent').then((m) => ({
    default: m.VarliklarContent,
  }))
);

type TabGroup = 'finans' | 'varliklar';
type VarliklarSubTab = 'kartlar' | 'yatirimlar' | 'emlak' | 'takvim';
type SubTab = FinansSubTab | VarliklarSubTab;

const VARLIKLAR_TAB_IDS: VarliklarSubTab[] = ['kartlar', 'yatirimlar', 'emlak', 'takvim'];

const SUB_TAB_KEYS: Record<SubTab, string> = {
  ozet: 'tabs.summary',
  'gelir-gider': 'tabs.incomeExpense',
  'duzenli-odemeler': 'tabs.regularPayments',
  'butce-hedefler': 'tabs.budgetGoals',
  hesaplar: 'tabs.accounts',
  kartlar: 'tabs.cards',
  yatirimlar: 'tabs.investments',
  emlak: 'tabs.assets',
  takvim: 'tabs.calendar',
};

const Family = () => {
  const { t } = useTranslation(['family', 'finance', 'common']);
  const navigate = useNavigate();
  const { isPremium, isScreenshotMode } = useSubscriptionContext();

  const [tabGroup, setTabGroup] = useState<TabGroup>('finans');
  const [finansTab, setFinansTab] = useState<FinansSubTab>('ozet');
  const [varliklarTab, setVarliklarTab] = useState<VarliklarSubTab>('kartlar');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const currentTabIds = tabGroup === 'finans' ? FINANS_TAB_IDS : VARLIKLAR_TAB_IDS;
  const activeSubTab = tabGroup === 'finans' ? finansTab : varliklarTab;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-2xl">
          <div className="flex h-14 items-center gap-4 px-4">
            <h1 className="text-lg font-semibold">{t('title', 'Aile Finansi')}</h1>
          </div>

          <TrialBanner />

          {/* Tab Group Segment */}
          <div className="flex gap-1 rounded-lg bg-secondary p-1 mx-4 mb-2">
            <button
              onClick={() => setTabGroup('finans')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                tabGroup === 'finans' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t('tabGroups.finance')}
            </button>
            <button
              onClick={() => setTabGroup('varliklar')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                tabGroup === 'varliklar' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t('tabGroups.assets')}
            </button>
          </div>

          {/* Sub-tab navigation */}
          <div className="px-4">
            <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
              {currentTabIds.map((tabId) => (
                <button
                  key={tabId}
                  onClick={() => {
                    if (tabGroup === 'finans') setFinansTab(tabId as FinansSubTab);
                    else setVarliklarTab(tabId as VarliklarSubTab);
                  }}
                  className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeSubTab === tabId
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {t(SUB_TAB_KEYS[tabId as SubTab])}
                  {(tabId === 'yatirimlar' || tabId === 'emlak') && !isPremium && !isScreenshotMode && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-r from-warning to-amber-500">
                      <Crown className="h-2 w-2 text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-5 py-4 pb-safe-nav">
        {tabGroup === 'finans' ? (
          <FinanceContent
            scope="family"
            activeSubTab={finansTab}
            onActiveSubTabChange={setFinansTab}
            pendingAction={pendingAction}
            onActionHandled={() => setPendingAction(null)}
          />
        ) : (
          <Suspense fallback={<div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
            <VarliklarContent activeSubTab={varliklarTab} />
          </Suspense>
        )}
      </main>

      <QuickAddFAB
        onAddExpense={() => { setTabGroup('finans'); setFinansTab('gelir-gider'); setPendingAction('expense'); }}
        onAddIncome={() => { setTabGroup('finans'); setFinansTab('gelir-gider'); setPendingAction('income'); }}
        onPayBill={() => { setTabGroup('finans'); setFinansTab('duzenli-odemeler'); }}
      />

      <MobileNav activeTab="family" />
    </div>
  );
};

export default Family;
