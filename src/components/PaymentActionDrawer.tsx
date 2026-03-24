import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Landmark, FileText, CheckCircle2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCardPayment } from '@/hooks/useCardPayment';
import { useLoans } from '@/hooks/useLoans';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { formatCurrency, parseTurkishNumber } from '@/lib/financeUtils';
import { useToast } from '@/hooks/use-toast';

interface PaymentActionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetType: 'card' | 'loan' | 'bill' | null;
  assetId: string | null;
  onPaymentComplete: () => void;
  storageKey?: string;
}

export function PaymentActionDrawer({
  open,
  onOpenChange,
  assetType,
  assetId,
  onPaymentComplete,
  storageKey,
}: PaymentActionDrawerProps) {
  const { t } = useTranslation(['notifications', 'common']);
  const { toast } = useToast();
  const [customAmount, setCustomAmount] = useState('');

  const { getCard, recordCardPayment } = useCardPayment(storageKey);
  const { loans, recordPayment: recordLoanPayment, markAsPaid } = useLoans();
  const { bills, recordPayment: recordBillPayment } = useRecurringBills();

  const asset = useMemo(() => {
    if (!assetType || !assetId) return null;
    if (assetType === 'card') {
      const card = getCard(assetId);
      if (!card) return null;
      return {
        name: `${card.bankName} ${card.cardName}`,
        subtitle: card.bankName,
        amount: card.currentDebt,
        amountLabel: t('notifications:paymentAction.currentDebt'),
        icon: CreditCard,
      };
    }
    if (assetType === 'loan') {
      const loan = loans.find((l) => l.id === assetId);
      if (!loan) return null;
      return {
        name: loan.name,
        subtitle: loan.bankName,
        amount: loan.monthlyPayment,
        amountLabel: t('notifications:paymentAction.monthlyPayment'),
        icon: Landmark,
      };
    }
    if (assetType === 'bill') {
      const bill = bills.find((b) => b.id === assetId);
      if (!bill) return null;
      return {
        name: bill.name,
        subtitle: bill.category || '',
        amount: bill.isFixedAmount ? bill.fixedAmount : (bill.lastPaidAmount || 0),
        amountLabel: t('notifications:paymentAction.billAmount'),
        icon: FileText,
      };
    }
    return null;
  }, [assetType, assetId, getCard, loans, bills, t]);

  function handleFullPayment() {
    if (!assetType || !assetId || !asset) return;
    executePayment(asset.amount);
  }

  function handleCustomPayment() {
    if (!assetType || !assetId || !asset) return;
    const amount = parseTurkishNumber(customAmount);
    if (!amount || amount <= 0) return;
    executePayment(amount);
  }

  function executePayment(amount: number) {
    if (!assetType || !assetId || !asset) return;

    if (assetType === 'card') {
      recordCardPayment(assetId, amount);
    } else if (assetType === 'loan') {
      recordLoanPayment({
        loanId: assetId,
        installmentNumber: 0,
        amount,
        paymentDate: new Date().toISOString(),
        status: 'paid',
      });
      markAsPaid(assetId);
    } else if (assetType === 'bill') {
      recordBillPayment(assetId, amount);
    }

    toast({
      title: t('notifications:paymentAction.success'),
      description: t('notifications:paymentAction.successDesc', {
        name: asset.name,
        amount: formatCurrency(amount),
      }),
    });

    setCustomAmount('');
    onPaymentComplete();
  }

  function handleClose(open: boolean) {
    if (!open) setCustomAmount('');
    onOpenChange(open);
  }

  const Icon = asset?.icon || CreditCard;

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <VisuallyHidden>
          <DrawerTitle>{t('notifications:paymentAction.title')}</DrawerTitle>
        </VisuallyHidden>
        <div className="space-y-4 p-4 pb-safe-nav">
          {!asset ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('notifications:paymentAction.notFound')}
              </p>
            </div>
          ) : (
            <>
              {/* Asset info */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{asset.name}</h3>
                  {asset.subtitle && (
                    <p className="text-xs text-muted-foreground">{asset.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Current amount */}
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{asset.amountLabel}</p>
                <p className="text-2xl font-bold">{formatCurrency(asset.amount)}</p>
              </div>

              {/* Full payment button */}
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleFullPayment}
                disabled={asset.amount <= 0}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {t('notifications:paymentAction.fullPayment')} — {formatCurrency(asset.amount)}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground">
                    {t('notifications:paymentAction.customAmount')}
                  </span>
                </div>
              </div>

              {/* Custom amount input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder={t('notifications:paymentAction.enterAmount')}
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={handleCustomPayment}
                  disabled={!customAmount || parseTurkishNumber(customAmount) <= 0}
                >
                  {t('notifications:paymentAction.pay')}
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
