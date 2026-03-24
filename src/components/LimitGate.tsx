import { useState } from 'react';
import { Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { checkLimit, type LimitKey } from '@/lib/premiumLimits';

const LIMIT_FEATURE_KEY: Record<LimitKey, string> = {
  CARDS: 'cards',
  ACCOUNTS: 'accounts',
  RECURRING_BILLS: 'bills',
  GOALS: 'goals',
  BUDGETS: 'budgets',
  MONTHLY_TRANSACTIONS: 'transactions',
};

interface LimitGateProps {
  limitKey: LimitKey;
  currentCount: number;
  children: React.ReactNode;
  onAllowed: () => void;
}

export function LimitGate({ limitKey, currentCount, children, onAllowed }: LimitGateProps) {
  const { t } = useTranslation(['subscription']);
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
  const [showPaywall, setShowPaywall] = useState(false);

  const effective = isPremium || isScreenshotMode;
  const { allowed, current, limit } = checkLimit(limitKey, currentCount, effective);
  const featureKey = LIMIT_FEATURE_KEY[limitKey];
  const atLimit = !effective && current >= limit;

  const handleClick = () => {
    if (allowed) {
      onAllowed();
    } else {
      setShowPaywall(true);
    }
  };

  return (
    <>
      <div className="relative inline-flex" onClick={handleClick}>
        <div className="cursor-pointer">{children}</div>
        {atLimit && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
            <Crown className="h-2 w-2" />
            {current}/{limit}
          </span>
        )}
        {!effective && !atLimit && current > 0 && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            {current}/{limit}
          </span>
        )}
      </div>

      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('subscription:limits.reached')}</DialogTitle>
          </VisuallyHidden>
          <div className="p-5 pb-0">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-warning/20 to-amber-500/10 p-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
                <Crown className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-bold text-foreground">{t('subscription:limits.reached')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('subscription:limits.freeLimit', {
                    limit,
                    feature: t(`subscription:limits.${featureKey}`),
                  })}
                </p>
                <p className="text-xs font-semibold text-warning mt-1">
                  {t('subscription:limits.current', { current, limit })}
                </p>
              </div>
            </div>
          </div>
          <SubscriptionPaywall onClose={() => setShowPaywall(false)} showCloseButton={false} />
        </DialogContent>
      </Dialog>
    </>
  );
}
