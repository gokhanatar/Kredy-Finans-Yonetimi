import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Receipt, ChevronRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringIncomes } from '@/hooks/useRecurringIncomes';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { useBudget } from '@/hooks/useBudget';
import { PERSONAL_STORAGE_KEYS } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { formatCurrency } from '@/lib/financeUtils';

export function HomeSafeToSpend() {
  const { t } = useTranslation(['cards', 'common']);
  const navigate = useNavigate();
  const { isPrivate } = usePrivacyMode();

  const txHook = useTransactions(PERSONAL_STORAGE_KEYS.TRANSACTIONS);
  const incomeHook = useRecurringIncomes(PERSONAL_STORAGE_KEYS.RECURRING_INCOMES);
  const subHook = useSubscriptions(PERSONAL_STORAGE_KEYS.SUBSCRIPTIONS);
  const recurHook = useRecurringExpenses(PERSONAL_STORAGE_KEYS.RECURRING_EXPENSES);
  const billHook = useRecurringBills(PERSONAL_STORAGE_KEYS.MONTHLY_BILLS);
  const budgetHook = useBudget(PERSONAL_STORAGE_KEYS.BUDGETS);

  const monthlyIncome = incomeHook.monthlyTotal > 0
    ? incomeHook.monthlyTotal
    : (budgetHook.currentBudget?.totalIncome || txHook.monthlyTotals.income);

  const totalBills = subHook.monthlyCost + recurHook.monthlyCost + billHook.monthlyCost;
  const safeToSpend = monthlyIncome - totalBills - txHook.monthlyTotals.expense;

  const hasData = monthlyIncome > 0 || totalBills > 0 || txHook.monthlyTotals.expense > 0;

  if (!hasData) {
    return (
      <button
        onClick={() => navigate('/wallet')}
        className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-left shadow-lg transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-white">{t('home.safeToSpend')}</p>
            <p className="text-sm text-white/80">{t('home.setupIncome')}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/70" />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/wallet')}
      className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-left shadow-lg transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-white/80" />
          <span className="text-sm font-medium text-white/80">{t('home.safeToSpend')}</span>
        </div>
        <span className="text-xs text-white/60">{t('home.tapForDetails')}</span>
      </div>

      <p className="text-3xl font-bold text-white mb-4">
        {isPrivate ? '***' : formatCurrency(safeToSpend)}
      </p>

      <div className="flex gap-3">
        <div className="flex-1 rounded-lg bg-white/15 backdrop-blur-sm px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <ArrowUpCircle className="h-3.5 w-3.5 text-white/70" />
            <span className="text-[10px] text-white/70">{t('summaryCard.income')}</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {isPrivate ? '***' : formatCurrency(monthlyIncome)}
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-white/15 backdrop-blur-sm px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Receipt className="h-3.5 w-3.5 text-white/70" />
            <span className="text-[10px] text-white/70">{t('summaryCard.expense')}</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {isPrivate ? '***' : formatCurrency(totalBills + txHook.monthlyTotals.expense)}
          </p>
        </div>
      </div>
    </button>
  );
}
