import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RecurringBill } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, CheckCircle } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';

interface RecurringBillListProps {
  bills: RecurringBill[];
  monthlyCost: number;
  onAdd: () => void;
  onEdit: (bill: RecurringBill) => void;
  onToggle: (id: string) => void;
  onPay: (id: string, amount: number) => void;
}

export function RecurringBillList({
  bills,
  monthlyCost,
  onAdd,
  onEdit,
  onToggle,
  onPay,
}: RecurringBillListProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount } = usePrivacyMode();
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const handlePaySubmit = () => {
    if (!payingBillId) return;
    const parsed = parseTurkishNumber(payAmount);
    if (parsed > 0) {
      onPay(payingBillId, parsed);
      setPayingBillId(null);
      setPayAmount('');
    }
  };

  const getPaymentDayLabel = (bill: RecurringBill): string => {
    if (bill.frequency === 'monthly' && bill.dayOfMonth) {
      return `${t('bills.dayOfMonth')}: ${bill.dayOfMonth}`;
    }
    if (bill.frequency === 'weekly' && bill.dayOfWeek !== undefined) {
      const days = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
      return days[bill.dayOfWeek] || '';
    }
    return t('bills.daily');
  };

  const getAmountLabel = (bill: RecurringBill): string => {
    if (bill.isFixedAmount && bill.fixedAmount) {
      return formatAmount(bill.fixedAmount);
    }
    if (bill.lastPaidAmount) {
      return `${t('bills.lastPaid')}: ${formatAmount(bill.lastPaidAmount)}`;
    }
    return t('bills.variableAmount');
  };

  return (
    <div className="space-y-3">
      {/* Cost Summary */}
      <div className="rounded-xl bg-indigo-500/10 p-3 text-center">
        <p className="text-xs text-muted-foreground">{t('bills.monthlyCost')}</p>
        <p className="text-lg font-bold text-indigo-600">{formatAmount(monthlyCost)}</p>
      </div>

      {/* Bill Items */}
      {bills.map((bill) => (
        <div
          key={bill.id}
          className={`rounded-xl bg-card p-3 shadow-sm ${!bill.isActive ? 'opacity-50' : ''}`}
        >
          <div className="flex items-center gap-3">
            <CategoryIcon name={bill.icon} size={24} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{bill.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getPaymentDayLabel(bill)}</span>
              </div>
            </div>
            <span className="text-sm font-semibold shrink-0">{getAmountLabel(bill)}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2">
            {bill.isActive && !bill.isFixedAmount && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs text-green-600 border-green-200"
                onClick={() => {
                  setPayingBillId(bill.id);
                  setPayAmount(bill.lastPaidAmount ? formatNumber(bill.lastPaidAmount) : '');
                }}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {t('bills.markPaid')}
              </Button>
            )}
            {bill.isActive && bill.isFixedAmount && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs text-green-600 border-green-200"
                onClick={() => bill.fixedAmount && onPay(bill.id, bill.fixedAmount)}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {t('bills.markPaid')}
              </Button>
            )}
            <Switch checked={bill.isActive} onCheckedChange={() => onToggle(bill.id)} />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(bill)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}

      {bills.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {t('bills.noBills')}
        </div>
      )}

      <Button variant="outline" className="w-full gap-2" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {t('bills.addBill')}
      </Button>

      {/* Pay Amount Drawer (for variable bills) */}
      <Drawer open={!!payingBillId} onOpenChange={(open) => { if (!open) { setPayingBillId(null); setPayAmount(''); } }}>
        <DrawerContent onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden><DrawerTitle>{t('bills.enterAmount')}</DrawerTitle></VisuallyHidden>
          <div className="space-y-4 p-4">
            <h3 className="text-sm font-semibold">{t('bills.enterAmount')}</h3>
            <Input
              type="text"
              inputMode="decimal"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
              onBlur={() => {
                if (payAmount) {
                  const parsed = parseTurkishNumber(payAmount);
                  if (parsed > 0) setPayAmount(formatNumber(parsed));
                }
              }}
              placeholder="0"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setPayingBillId(null); setPayAmount(''); }}>
                {t('common:actions.cancel')}
              </Button>
              <Button className="flex-1" onClick={handlePaySubmit}>
                {t('bills.markPaid')}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
