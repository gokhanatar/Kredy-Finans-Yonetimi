import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PriceRefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastFetchedText: string;
}

export function PriceRefreshButton({ onRefresh, isRefreshing, lastFetchedText }: PriceRefreshButtonProps) {
  const { t } = useTranslation(['common']);

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onRefresh}
        disabled={isRefreshing}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        {t('actions.refresh')}
      </Button>
      <span className="text-xs text-muted-foreground">{lastFetchedText}</span>
    </div>
  );
}
