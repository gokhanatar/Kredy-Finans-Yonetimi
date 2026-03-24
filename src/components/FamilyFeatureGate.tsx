import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useFamilySync } from '@/contexts/FamilySyncContext';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { getFamilyPermissions, type FamilyFeature } from '@/lib/premiumLimits';

interface FamilyFeatureGateProps {
  feature: FamilyFeature;
  children: ReactNode;
  fallback?: ReactNode;
  mode?: 'hide' | 'overlay' | 'disable';
}

export function FamilyFeatureGate({
  feature,
  children,
  fallback,
  mode = 'overlay',
}: FamilyFeatureGateProps) {
  const { t } = useTranslation(['family', 'subscription', 'common']);
  const { isPremium } = useSubscriptionContext();
  const { isConnected } = useFamilySync();
  const [showPaywall, setShowPaywall] = useState(false);

  // If not in family mode, render children normally
  if (!isConnected) return <>{children}</>;

  const permissions = getFamilyPermissions(feature, isPremium);

  // If user has permission, render children
  if (permissions.canView || permissions.canEdit || permissions.canCreate) {
    return <>{children}</>;
  }

  // No permission — apply gate based on mode
  if (mode === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  if (mode === 'disable') {
    return (
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
    );
  }

  // mode === 'overlay'
  return (
    <>
      <div className="relative">
        <div className="pointer-events-none opacity-30 blur-[2px]">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/15">
            <Lock className="h-6 w-6 text-warning" />
          </div>
          <p className="text-sm font-medium text-foreground text-center px-4">
            {t('family:proFeature', { defaultValue: 'Bu özellik PRO üyelere açıktır' })}
          </p>
          <Button
            size="sm"
            onClick={() => setShowPaywall(true)}
            className="gap-1.5 bg-gradient-to-r from-warning to-amber-500 text-white hover:from-warning/90 hover:to-amber-500/90"
          >
            <Crown className="h-3.5 w-3.5" />
            {t('subscription:proButton')}
          </Button>
        </div>
      </div>

      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{t('subscription:title')}</DialogTitle>
          </VisuallyHidden>
          <SubscriptionPaywall
            onClose={() => setShowPaywall(false)}
            showCloseButton={true}
            context="family"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface FamilyActionGateProps {
  feature: FamilyFeature;
  action: 'edit' | 'create' | 'delete';
  children: ReactNode;
}

export function FamilyActionGate({ feature, action, children }: FamilyActionGateProps) {
  const { isPremium } = useSubscriptionContext();
  const { isConnected } = useFamilySync();

  if (!isConnected) return <>{children}</>;

  const permissions = getFamilyPermissions(feature, isPremium);

  const hasPermission =
    (action === 'edit' && permissions.canEdit) ||
    (action === 'create' && permissions.canCreate) ||
    (action === 'delete' && permissions.canDelete);

  if (hasPermission) return <>{children}</>;

  return null;
}
