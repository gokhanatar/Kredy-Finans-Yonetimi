import { useState } from 'react';
import { Crown } from 'lucide-react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useTranslation } from 'react-i18next';

interface PremiumLockOverlayProps {
  children: React.ReactNode;
  showFloatingButton?: boolean;
}

export function PremiumLockOverlay({ children, showFloatingButton = true }: PremiumLockOverlayProps) {
  const { isPremium, isScreenshotMode } = useSubscriptionContext();
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useTranslation(['subscription']);

  if (isPremium || isScreenshotMode) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative">
        {/* Actual page content - fully visible but not interactive */}
        <div className="pointer-events-none select-none">
          {children}
        </div>

        {/* Lock overlay - transparent, clickable */}
        <div
          className="absolute inset-0 z-30 cursor-pointer"
          onClick={() => setShowPaywall(true)}
        />

        {/* Floating PRO badge - top right, non-blocking */}
        {showFloatingButton && (
          <button
            onClick={() => setShowPaywall(true)}
            className="fixed top-20 right-4 z-40 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-warning to-amber-500 px-3 py-2 shadow-lg animate-pulse"
          >
            <Crown className="h-4 w-4 text-white" />
            <span className="text-xs font-bold text-white">{t('proButton')}</span>
          </button>
        )}
      </div>

      {/* Paywall Dialog */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('title')}</DialogTitle>
          </VisuallyHidden>
          <SubscriptionPaywall
            onClose={() => setShowPaywall(false)}
            showCloseButton={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
