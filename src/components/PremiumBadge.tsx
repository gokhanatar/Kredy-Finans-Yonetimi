import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PremiumBadge({ className, size = 'md' }: PremiumBadgeProps) {
  const { t } = useTranslation(['subscription']);
  const { isScreenshotMode } = useSubscriptionContext();

  if (isScreenshotMode) return null;
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-0.5 text-[10px]',
    lg: 'px-3 py-1 text-xs',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-warning to-warning/80 font-semibold text-white',
        sizeClasses[size],
        className
      )}
    >
      <Crown className={iconSizes[size]} />
      {t('proBadge')}
    </span>
  );
}
