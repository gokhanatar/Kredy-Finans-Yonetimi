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
