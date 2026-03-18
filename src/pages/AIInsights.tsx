import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Brain, Lightbulb, PiggyBank, Scale, MessageSquare, Camera } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

const SpendingInsights = lazy(() => import('@/components/SpendingInsights'));
const BudgetSuggestionCard = lazy(() => import('@/components/BudgetSuggestionCard'));
const DebtStrategyAdvisor = lazy(() => import('@/components/DebtStrategyAdvisor'));
const QuickExpenseInput = lazy(() => import('@/components/QuickExpenseInput'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const AIInsights = () => {
  const { t } = useTranslation(['ai', 'common']);
  const navigate = useNavigate();
  const { isPremium } = useSubscriptionContext();

  const tabs = [
    { id: 'insights', labelKey: 'ai:tabs.insights', icon: Lightbulb },
    { id: 'budget', labelKey: 'ai:tabs.budget', icon: PiggyBank },
    { id: 'debt', labelKey: 'ai:tabs.debt', icon: Scale },
    { id: 'nlp', labelKey: 'ai:tabs.nlp', icon: MessageSquare },
    { id: 'receipt', labelKey: 'ai:tabs.receipt', icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="page-container">
          <div className="flex h-14 items-center gap-3 px-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">{t('ai:title')}</h1>
            </div>
          </div>
        </div>
      </div>

      <PremiumLockOverlay>
        <main className="page-container py-4 pb-safe-nav lg:pb-6">
          <p className="mb-4 text-sm text-muted-foreground">{t('ai:subtitle')}</p>

          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="mb-4 flex w-full overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                    <span className="sm:hidden">{t(tab.labelKey)}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="insights">
              <Suspense fallback={<PageLoader />}>
                <SpendingInsights />
              </Suspense>
            </TabsContent>

            <TabsContent value="budget">
              <Suspense fallback={<PageLoader />}>
                <BudgetSuggestionCard />
              </Suspense>
            </TabsContent>

            <TabsContent value="debt">
              <Suspense fallback={<PageLoader />}>
                <DebtStrategyAdvisor />
              </Suspense>
            </TabsContent>

            <TabsContent value="nlp">
              <Suspense fallback={<PageLoader />}>
                <QuickExpenseInput />
              </Suspense>
            </TabsContent>

            <TabsContent value="receipt">
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base font-semibold">{t('ai:receipt.title')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('ai:receipt.subtitle')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate('/wallet')}
                  >
                    <Camera className="h-4 w-4" />
                    {t('ai:receipt.scanAndSave')}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </PremiumLockOverlay>

    </div>
  );
};

export default AIInsights;
