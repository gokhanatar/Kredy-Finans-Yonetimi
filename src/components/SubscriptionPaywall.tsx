import { useState, useEffect } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useSubscription } from '@/hooks/useSubscription';
import { iapService, IAPProduct } from '@/lib/iapService';
import { hasUsedTrial, TRIAL_DAYS } from '@/lib/purchases';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  Crown,
  Check,
  Sparkles,
  TrendingUp,
  X,
  Loader2,
  CreditCard,
  Wallet,
  Target,
  FileText,
  Calculator,
  BarChart3,
  Users,
  Repeat,
  Globe,
  RotateCcw,
  Star,
  Camera,
  Home,
  Settings,
  Smartphone,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionPaywallProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  context?: 'default' | 'family';
}

const FEATURE_CATEGORIES = [
  {
    titleKey: 'categories.limitBased',
    features: [
      { icon: CreditCard, textKey: 'features.unlimitedCards' },
      { icon: Wallet, textKey: 'features.unlimitedAccounts' },
      { icon: Repeat, textKey: 'features.unlimitedBills' },
      { icon: Target, textKey: 'features.unlimitedGoals' },
      { icon: BarChart3, textKey: 'features.unlimitedBudgets' },
      { icon: FileText, textKey: 'features.unlimitedTransactions' },
      { icon: TrendingUp, textKey: 'features.fullHistory' },
      { icon: Globe, textKey: 'features.multiCurrency' },
      { icon: FileText, textKey: 'features.exportData' },
    ],
  },
  {
    titleKey: 'categories.proOnly',
    features: [
      { icon: TrendingUp, textKey: 'features.investments' },
      { icon: Home, textKey: 'features.assets' },
      { icon: Calculator, textKey: 'features.simulators' },
      { icon: Users, textKey: 'features.familyAdmin' },
      { icon: Camera, textKey: 'features.receiptScanner' },
      { icon: Sparkles, textKey: 'features.templates' },
      { icon: CreditCard, textKey: 'features.commercialMode' },
      { icon: Smartphone, textKey: 'features.widgets' },
    ],
  },
];

type SelectedPlan = 'yearly' | 'monthly';

export function SubscriptionPaywall({ onClose, showCloseButton = true, context = 'default' }: SubscriptionPaywallProps) {
  const { t } = useTranslation(['subscription', 'common']);
  const { isPremium, isTrialActive, trialDaysLeft, subscriptionPlan, subscriptionExpiresAt, checkPremiumAccess, isNativeIAP, restorePurchases } = useSubscriptionContext();
  const { startTrial } = useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>('yearly');
  const [products, setProducts] = useState<IAPProduct[]>([]);

  const isNativePlatform = typeof window !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.() === true;

  useEffect(() => {
    iapService.getProducts().then(setProducts);
  }, []);

  const monthlyProduct = products.find(p => p.period === 'monthly');
  const yearlyProduct = products.find(p => p.period === 'yearly');

  const monthlyPrice = monthlyProduct?.price || '$1,99';
  const yearlyPrice = yearlyProduct?.price || '$19,99';
  const yearlyMonthlyPrice = yearlyProduct
    ? `$${(yearlyProduct.priceAmount / 12).toFixed(2).replace('.', ',')}`
    : '$1,67';

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      // Plugin hazır değilse initialize dene
      if (!iapService.isPluginReady()) {
        await iapService.initialize();
      }

      const success = selectedPlan === 'yearly'
        ? await iapService.purchaseYearly()
        : await iapService.purchaseMonthly();

      if (success) {
        await checkPremiumAccess();
        toast({ title: t('actions.purchaseSuccess', { defaultValue: 'Abonelik aktif!' }) });
        if (onClose) onClose();
      } else {
        toast({ title: t('errors.notAvailable'), variant: 'destructive' });
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('cancel') || err?.code === 'USER_CANCELLED' || err?.code === 'userCancelled') {
        toast({ title: t('errors.purchaseCancelled'), variant: 'destructive' });
      } else {
        toast({ title: t('errors.purchaseFailed'), variant: 'destructive' });
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        toast({ title: t('actions.restored') });
        if (onClose) onClose();
      } else {
        toast({ title: t('actions.noRestore'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('errors.purchaseFailed'), variant: 'destructive' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = async () => {
    await iapService.manageSubscriptions();
  };

  const handleRedeemCode = async () => {
    setIsRedeeming(true);
    try {
      const success = await iapService.redeemOfferCode();
      if (success) {
        await checkPremiumAccess();
        toast({ title: t('actions.redeemSuccess', { defaultValue: 'Kod kullanıldı!' }) });
        if (onClose) onClose();
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (!msg.includes('cancel')) {
        toast({ title: t('errors.redeemFailed', { defaultValue: 'Kod kullanılamadı' }), variant: 'destructive' });
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleStartTrial = async () => {
    setIsPurchasing(true);
    await startTrial();
    setIsPurchasing(false);
    if (onClose) onClose();
  };

  const trialUsed = hasUsedTrial();

  // PRO active view (trial hariç — trial'da satın alma seçenekleri gösterilmeli)
  if (isPremium && subscriptionPlan !== 'trial') {
    const getPlanLabel = () => {
      if (isTrialActive) return t('proActive.trial', { defaultValue: 'Deneme Sürümü' });
      if (subscriptionPlan === 'yearly') return t('proActive.yearly');
      if (subscriptionPlan === 'monthly') return t('proActive.monthly');
      return 'Pro';
    };

    const getExpiryText = () => {
      if (subscriptionExpiresAt) {
        if (isTrialActive) {
          return `${trialDaysLeft} ${t('common:time.days', { defaultValue: 'gün' })} ${t('proActive.trialRemaining', { defaultValue: 'deneme kaldı' })}`;
        }
        return t('proActive.expiresAt', {
          date: new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(subscriptionExpiresAt),
        });
      }
      return t('proActive.noExpiry');
    };

    return (
      <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-secondary/30 p-5">
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80 text-foreground shadow-md transition-colors hover:bg-secondary active:scale-95"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        <div className="mt-8 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-warning to-amber-500 shadow-lg">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">{t('proActive.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('proActive.subtitle')}</p>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-warning/15 via-amber-500/10 to-orange-500/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('proActive.plan')}</p>
          <p className="mt-1 text-lg font-bold text-foreground">{getPlanLabel()}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{getExpiryText()}</p>
        </div>

        {/* Feature list — all unlocked */}
        <div className="mt-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('proActive.allFeatures')}</h3>
          {FEATURE_CATEGORIES.map((category, catIdx) => (
            <div key={catIdx} className="rounded-2xl bg-card p-4 shadow-soft">
              <h4 className="mb-3 text-xs font-bold text-card-foreground uppercase tracking-wider">
                {t(category.titleKey)}
              </h4>
              <div className="space-y-2.5">
                {category.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15">
                      <feature.icon className="h-3.5 w-3.5 text-success" />
                    </div>
                    <span className="text-sm text-foreground">{t(feature.textKey)}</span>
                    <Check className="ml-auto h-4 w-4 text-success" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Manage Subscription button */}
        {isNativeIAP && (
          <div className="mt-5">
            <Button
              onClick={handleManageSubscription}
              variant="outline"
              className="w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              {t('actions.manageSubscription', { defaultValue: 'Aboneliği Yönet' })}
            </Button>
          </div>
        )}

        {onClose && (
          <div className="mt-auto pt-6 pb-4">
            <Button
              onClick={onClose}
              className="w-full py-6 text-lg font-bold bg-success hover:bg-success/90 text-white shadow-lg"
              size="lg"
            >
              <Check className="mr-2 h-5 w-5" />
              {t('proActive.close')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Non-premium view
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-secondary/30 p-5">
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80 text-foreground shadow-md transition-colors hover:bg-secondary active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Family context banner */}
      {context === 'family' && (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-primary/10 to-emerald-500/10 p-4 text-center">
          <p className="font-semibold text-foreground">{t('familyContext.title', { defaultValue: 'Aile Grubunda PRO Avantajları' })}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('familyContext.description', { defaultValue: 'Sınırsız işlem, bütçe yönetimi, hesap ve hedef oluşturma' })}</p>
        </div>
      )}

      {/* Header */}
      <div className="mt-6 text-center">
        <img src="/logo.png" alt={t('common:appName')} className="mx-auto mb-4 h-20 w-20 rounded-3xl shadow-lg" />
        <h1 className="text-2xl font-bold text-foreground">{t('common:appName')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Plan Cards — only on native */}
      {isNativePlatform && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* Yearly */}
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={cn(
              'relative rounded-2xl border-2 p-4 text-left transition-all',
              selectedPlan === 'yearly'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card'
            )}
          >
            <span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              <Star className="h-2.5 w-2.5" />
              {t('plans.recommended')}
            </span>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{t('plans.yearly')}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{yearlyPrice}</p>
            <p className="text-xs text-muted-foreground">{yearlyMonthlyPrice}{t('plans.perMonth')}</p>
            <span className="mt-2 inline-block rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
              {t('plans.savings', { percent: '17' })}
            </span>
          </button>

          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              'relative rounded-2xl border-2 p-4 text-left transition-all',
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card'
            )}
          >
            <p className="mt-1 text-xs font-medium text-muted-foreground">{t('plans.monthly')}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{monthlyPrice}</p>
            <p className="text-xs text-muted-foreground">{t('plans.perMonth')}</p>
          </button>
        </div>
      )}

      {/* Purchase Button — native only */}
      {isNativePlatform && (
        <div className="mt-4 space-y-2">
          <Button
            onClick={handlePurchase}
            disabled={isPurchasing}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
            size="lg"
          >
            {isPurchasing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Crown className="mr-2 h-5 w-5" />
                {t('actions.subscribeTo', { price: selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice })}
              </>
            )}
          </Button>

          {/* Restore + Redeem Code */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="flex items-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRestoring ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              {isRestoring ? t('actions.restoring') : t('actions.restore')}
            </button>

            <span className="text-muted-foreground/40">|</span>

            <button
              onClick={handleRedeemCode}
              disabled={isRedeeming}
              className="flex items-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRedeeming ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Gift className="h-3 w-3" />
              )}
              {isRedeeming ? t('actions.redeeming', { defaultValue: 'Kontrol ediliyor...' }) : t('actions.redeemCode', { defaultValue: 'Promosyon Kodu' })}
            </button>
          </div>
        </div>
      )}

      {/* Web message — no IAP on web */}
      {!isNativePlatform && (
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-4 text-center">
          <Smartphone className="mx-auto h-8 w-8 text-primary mb-2" />
          <p className="font-semibold text-foreground">
            {t('webOnly.title', { defaultValue: 'Mobil Uygulamadan Abone Olun' })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('webOnly.description', { defaultValue: 'Pro abonelik iOS ve Android uygulamasından satın alınabilir.' })}
          </p>
        </div>
      )}

      {/* Trial — henüz kullanılmadıysa */}
      {!trialUsed && !isTrialActive && (
        <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-success/20 via-success/10 to-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
              <Gift className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-success">
                {TRIAL_DAYS} {t('trial.daysLabel', { defaultValue: 'Gün Ücretsiz Deneyin!' })}
              </p>
              <p className="text-xs text-muted-foreground">{t('trial.noPayment', { defaultValue: 'Ödeme bilgisi gerekmez • Tüm özellikler açık' })}</p>
            </div>
          </div>
          <Button
            onClick={handleStartTrial}
            disabled={isPurchasing}
            className="mt-3 w-full bg-success hover:bg-success/90 font-semibold"
          >
            {isPurchasing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('trial.startButton', { defaultValue: 'Ücretsiz Başla' })}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Aktif deneme bilgisi */}
      {isTrialActive && (
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold text-primary">{t('trial.activeLabel', { defaultValue: 'Deneme Sürümü Aktif' })}</p>
              <p className="text-sm text-muted-foreground">
                {trialDaysLeft} {t('common:time.days', { defaultValue: 'gün' })} — {t('trial.featuresEnabled', { defaultValue: 'Tüm özellikler açık' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature list */}
      <div className="mt-5 space-y-4">
        {FEATURE_CATEGORIES.map((category, catIdx) => (
          <div key={catIdx} className="rounded-2xl bg-card p-4 shadow-soft">
            <h3 className="mb-3 text-sm font-bold text-card-foreground uppercase tracking-wider">
              {t(category.titleKey)}
            </h3>
            <div className="space-y-2.5">
              {category.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{t(feature.textKey)}</span>
                  <Check className="ml-auto h-4 w-4 text-success" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legal */}
      <div className="mt-auto space-y-3 pt-6 pb-4">
        <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
          {t('terms')}
        </p>
      </div>
    </div>
  );
}
