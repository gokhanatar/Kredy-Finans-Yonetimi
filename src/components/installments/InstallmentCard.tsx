import { useTranslation } from 'react-i18next';
import { Check, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/financeUtils';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { cn } from '@/lib/utils';
import type { CardInstallment } from '@/types/finance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface InstallmentCardProps {
  installment: CardInstallment;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InstallmentCard({ installment, onMarkPaid, onDelete }: InstallmentCardProps) {
  const { t } = useTranslation(['cards', 'common']);
  const { isPrivate } = usePrivacyMode();

  const isCompleted = !!installment.completedAt;
  const progress = (installment.paidInstallments / installment.installmentCount) * 100;
  const remaining = (installment.installmentCount - installment.paidInstallments) * installment.monthlyPayment;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 space-y-2 transition-colors',
        isCompleted ? 'bg-muted/30 border-muted' : 'bg-card border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isCompleted ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Check className="h-4 w-4 text-success" />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <p className={cn('text-sm font-medium truncate', isCompleted && 'text-muted-foreground')}>
              {installment.description}
            </p>
            {installment.merchant && (
              <p className="text-xs text-muted-foreground truncate">{installment.merchant}</p>
            )}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('cards:installments.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{installment.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(installment.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common:actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {installment.paidInstallments}/{installment.installmentCount} {t('cards:installments.paid')}
          </span>
          <span className="font-medium">
            {isPrivate ? '***' : formatCurrency(installment.monthlyPayment)}/{t('cards:installments.month')}
          </span>
        </div>
        <Progress
          value={progress}
          className={cn('h-1.5', isCompleted && '[&>div]:bg-success')}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {isCompleted
            ? t('cards:installments.completed')
            : `${t('cards:installments.remaining')}: ${isPrivate ? '***' : formatCurrency(remaining)}`}
        </span>

        {!isCompleted && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => onMarkPaid(installment.id)}
          >
            <Check className="h-3 w-3" />
            {t('cards:installments.markPaid')}
          </Button>
        )}
      </div>
    </div>
  );
}
