import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Crown, ChevronRight } from 'lucide-react';
import { CreditCard } from '@/types/finance';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface CommercialAnalyticsBannerProps {
  cards: CreditCard[];
}

export function CommercialAnalyticsBanner({ cards }: CommercialAnalyticsBannerProps) {
  const { t } = useTranslation(['cards']);
  const navigate = useNavigate();
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
  const [showPaywall, setShowPaywall] = useState(false);

  const hasCommercialCards = cards.some(c => c.cardType === 'ticari');

  if (!hasCommercialCards) return null;

  const handleClick = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    navigate('/commercial-analytics');
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full rounded-2xl bg-gradient-to-r from-indigo-500/10 to-primary/5 p-4 text-left shadow-soft transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold flex items-center gap-2">
              {t('commercial.bannerTitle')}
              {!isPremium && !isScreenshotMode && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-warning to-warning/80 px-1.5 py-0.5 text-[8px] font-bold text-white">
                  <Crown className="h-2 w-2" />PRO
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{t('commercial.bannerDesc')}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </button>

      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('commercial.title')}</DialogTitle>
          </VisuallyHidden>
          <SubscriptionPaywall
            onClose={() => setShowPaywall(false)}
            showCloseButton={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
