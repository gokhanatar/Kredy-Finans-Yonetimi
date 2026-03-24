import { useTranslation } from 'react-i18next';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { Wallet } from 'lucide-react';

interface SafeToSpendProps {
  amount: number;
  monthlyIncome: number;
  totalBills: number;
  totalBudgeted: number;
}

export function SafeToSpend({ amount, monthlyIncome, totalBills, totalBudgeted }: SafeToSpendProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount } = usePrivacyMode();

  return (
    <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="h-5 w-5 text-emerald-600" />
        <span className="text-sm font-semibold">{t('budget.safeToSpend')}</span>
      </div>
      <p className={`text-2xl font-bold ${amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {formatAmount(amount)}
      </p>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>{t('budget.income')}</span>
          <span>{formatAmount(monthlyIncome)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('budget.bills')}</span>
          <span>-{formatAmount(totalBills)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('budget.budgeted')}</span>
          <span>-{formatAmount(totalBudgeted)}</span>
        </div>
        <div className="border-t pt-1 flex justify-between font-medium text-foreground">
          <span>{t('budget.remaining')}</span>
          <span>{formatAmount(amount)}</span>
        </div>
      </div>
    </div>
  );
}
