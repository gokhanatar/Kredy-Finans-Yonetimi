import { useState } from 'react';
import { Crown, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useTranslation } from 'react-i18next';
import { hasUsedTrial, TRIAL_DAYS } from '@/lib/purchases';

export function TrialBanner() {
  const { t } = useTranslation(['family', 'subscription', 'common']);
  const { isPremium, isTrialActive, trialDaysLeft, isScreenshotMode } = useSubscriptionContext();
  const { startTrial } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  if (isScreenshotMode) return null;

  // Active trial → show days remaining + upgrade button
  if (isPremium && isTrialActive) {
    return (
      <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary">{t('subscription:trial.activeLabel', { defaultValue: 'Deneme Sürümü Aktif' })}</p>
          <p className="text-[10px] text-muted-foreground">
            {trialDaysLeft} {t('common:time.days', { defaultValue: 'gün' })} {t('family:trialBanner.remaining', { defaultValue: 'kaldı' })}
          </p>
        </div>
        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowPaywall(true)}>
          <Crown className="h-3 w-3 mr-1" />
          {t('family:trialBanner.upgrade', { defaultValue: "Pro'ya Geç" })}
        </Button>

        <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
          <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
            <VisuallyHidden><DialogTitle>Premium</DialogTitle></VisuallyHidden>
            <SubscriptionPaywall onClose={() => setShowPaywall(false)} showCloseButton={true} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Premium (not trial) → no banner
  if (isPremium) return null;

  const trialUsed = hasUsedTrial();

  // Never tried → show "Start Free Trial"
  if (!trialUsed) {
    const handleStartTrial = async () => {
      setIsStarting(true);
      await startTrial();
      setIsStarting(false);
    };

    return (
      <div className="mx-4 mb-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-teal-500/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">{t('family:trialBanner.freeTrialTitle', { defaultValue: 'Ücretsiz Deneyin' })}</p>
            <p className="text-[10px] text-muted-foreground">
              {t('family:trialBanner.freeTrialDesc', { defaultValue: `${TRIAL_DAYS} gün tüm premium özelliklere erişin` })}
            </p>
          </div>
          <Button
            size="sm"
            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleStartTrial}
            disabled={isStarting}
          >
            {isStarting ? '...' : t('family:trialBanner.startTrial', { defaultValue: 'Başlat' })}
          </Button>
        </div>
      </div>
    );
  }

  // Trial expired → show upgrade
  return (
    <>
      <div className="mx-4 mb-3 rounded-xl bg-gradient-to-r from-warning/10 to-amber-500/5 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15">
            <Crown className="h-4 w-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">
              {t('family:trialBanner.expiredTitle', { defaultValue: 'Deneme Süresi Doldu' })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t('family:trialBanner.expiredDesc', { defaultValue: 'Premium özelliklere erişmek için Pro\'ya geçin' })}
            </p>
          </div>
          <Button size="sm" className="text-xs h-8" onClick={() => setShowPaywall(true)}>
            <Crown className="h-3 w-3 mr-1" />
            {t('family:trialBanner.upgrade', { defaultValue: "Pro'ya Geç" })}
          </Button>
        </div>
      </div>

      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden><DialogTitle>Premium</DialogTitle></VisuallyHidden>
          <SubscriptionPaywall onClose={() => setShowPaywall(false)} showCloseButton={true} />
        </DialogContent>
      </Dialog>
    </>
  );
}
