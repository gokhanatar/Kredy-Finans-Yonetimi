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
