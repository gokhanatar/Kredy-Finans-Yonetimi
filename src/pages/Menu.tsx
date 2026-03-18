import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, TrendingUp } from 'lucide-react';
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
        <div className="page-container">
          <div className="flex h-14 items-center gap-4 px-4">
            <h1 className="text-lg font-semibold">{t('common:nav.menu', 'Menü')}</h1>
          </div>
        </div>
      </div>

      <main className="page-container py-4 pb-safe-nav lg:pb-6">
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
                navigate('/');
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
            <button
              onClick={() => window.open('https://gokhanatar.github.io/Kredy-Finans-Yonetimi/privacy-policy.html', '_blank')}
              className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft"
            >
              <span className="font-medium">🔒 {t('common:legal.privacyPolicy', 'Gizlilik Politikası')}</span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button
              onClick={() => window.open('https://gokhanatar.github.io/Kredy-Finans-Yonetimi/terms-of-use.html', '_blank')}
              className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft"
            >
              <span className="font-medium">📋 {t('common:legal.termsOfUse', 'Kullanım Koşulları')}</span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
        </div>
      </main>

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
