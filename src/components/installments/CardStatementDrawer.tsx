import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Banknote, CreditCard as CreditCardIcon, AlertTriangle } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/financeUtils';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { useCardInstallments } from '@/hooks/useCardInstallments';
import { useToast } from '@/hooks/use-toast';
import { InstallmentList } from './InstallmentList';
import { CompletedInstallmentList } from './CompletedInstallmentList';
import { AddInstallmentDialog } from './AddInstallmentDialog';
import type { CreditCard } from '@/types/finance';

interface CardStatementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCard;
  onEditCard: () => void;
  onPayClick?: () => void;
  storageKey?: string;
}

export function CardStatementDrawer({
  open,
  onOpenChange,
  card,
  onEditCard,
  onPayClick,
  storageKey,
}: CardStatementDrawerProps) {
  const { t } = useTranslation(['cards', 'common']);
  const { isPrivate } = usePrivacyMode();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const {
    getActiveByCard,
    getCompletedByCard,
    getCardInstallmentDebt,
    getCardMonthlyBurden,
    addInstallment,
    addRetroactiveInstallment,
    markInstallmentPaid,
    deleteInstallment,
  } = useCardInstallments(storageKey);

  const activeInstallments = useMemo(() => getActiveByCard(card.id), [getActiveByCard, card.id]);
  const completedInstallments = useMemo(() => getCompletedByCard(card.id), [getCompletedByCard, card.id]);
  const installmentDebt = useMemo(() => getCardInstallmentDebt(card.id), [getCardInstallmentDebt, card.id]);
  const monthlyBurden = useMemo(() => getCardMonthlyBurden(card.id), [getCardMonthlyBurden, card.id]);

  const hasInstallments = activeInstallments.length > 0 || completedInstallments.length > 0;
  const otherDebt = Math.max(0, card.currentDebt - installmentDebt);
  const debtMismatch = installmentDebt > card.currentDebt && card.currentDebt > 0;

  const handleAddInstallment = (data: any) => {
    if (data.isRetroactive) {
      addRetroactiveInstallment(data);
      toast({
        title: t('cards:installments.retroactiveAdded'),
        description: t('cards:installments.retroactiveAddedDesc', {
          paid: data.paidInstallments,
          total: data.installmentCount,
        }),
      });
    } else {
      addInstallment(data);
      // Increase card debt for new installments — caller must handle this via storageKey
      toast({
        title: t('cards:installments.added'),
        description: t('cards:installments.addedDesc', {
          name: data.description,
          count: data.installmentCount,
        }),
      });
    }
  };

  const handleMarkPaid = (id: string) => {
    const inst = activeInstallments.find((i) => i.id === id);
    if (!inst) return;

    markInstallmentPaid(id);

    const newPaid = inst.paidInstallments + 1;
    const isComplete = newPaid >= inst.installmentCount;

    toast({
      title: isComplete
        ? t('cards:installments.allPaid')
        : t('cards:installments.installmentPaid'),
      description: isComplete
        ? inst.description
        : `${inst.description} — ${newPaid}/${inst.installmentCount}`,
    });
  };

  const handleDelete = (id: string) => {
    deleteInstallment(id);
    toast({
      title: t('cards:installments.deleted'),
      variant: 'destructive',
    });
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <VisuallyHidden>
            <DrawerTitle>{t('cards:installments.statementTitle')}</DrawerTitle>
          </VisuallyHidden>

          <div className="space-y-4 p-4 pb-safe-nav max-h-[80vh] overflow-y-auto">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}>
                  <CreditCardIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{card.bankName} — {card.cardName}</h3>
                  <p className="text-xs text-muted-foreground">•••• {card.lastFourDigits}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onEditCard} className="gap-1">
                <Pencil className="h-3.5 w-3.5" />
                {t('cards:installments.edit')}
              </Button>
            </div>

            {/* Debt / Limit Summary */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('cards:installments.totalDebt')}</span>
                <span className="text-sm font-bold">
                  {isPrivate ? '***' : formatCurrency(card.currentDebt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('cards:installments.availableLimit')}</span>
                <span className="text-sm font-medium">
                  {isPrivate ? '***' : formatCurrency(card.availableLimit)}
                </span>
              </div>
            </div>

            {/* Installment Breakdown (only if installments exist) */}
            {hasInstallments && activeInstallments.length > 0 && (
              <div className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cards:installments.installmentDebt')}</span>
                  <span className="font-semibold">{isPrivate ? '***' : formatCurrency(installmentDebt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cards:installments.otherDebt')}</span>
                  <span className="font-medium">{isPrivate ? '***' : formatCurrency(otherDebt)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cards:installments.monthlyBurden')}</span>
                  <span className="font-semibold text-primary">{isPrivate ? '***' : formatCurrency(monthlyBurden)}</span>
                </div>

                {debtMismatch && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-warning-muted p-2 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {t('cards:installments.debtMismatch')}
                  </div>
                )}
              </div>
            )}

            {/* No installments hint */}
            {!hasInstallments && (
              <p className="text-center text-sm text-muted-foreground py-2">
                {t('cards:installments.emptyHint')}
              </p>
            )}

            {/* Active Installments */}
            <InstallmentList
              installments={activeInstallments}
              onMarkPaid={handleMarkPaid}
              onDelete={handleDelete}
            />

            {/* Completed Installments */}
            <CompletedInstallmentList
              installments={completedInstallments}
              onDelete={handleDelete}
            />

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4" />
                {t('cards:installments.addButton')}
              </Button>
              {onPayClick && card.currentDebt > 0 && (
                <Button className="flex-1 gap-1.5" onClick={onPayClick}>
                  <Banknote className="h-4 w-4" />
                  {t('cards:installments.payButton')}
                </Button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <AddInstallmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        cardId={card.id}
        onAdd={handleAddInstallment}
      />
    </>
  );
}
