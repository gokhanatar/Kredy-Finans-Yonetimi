import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { EXPENSE_CATEGORIES, FamilyTransaction } from '@/types/familyFinance';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';

interface TransactionSummaryProps {
  income: number;
  expense: number;
  categoryBreakdown: { category: string; amount: number }[];
}

export function TransactionSummary({ income, expense, categoryBreakdown }: TransactionSummaryProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount } = usePrivacyMode();
  const net = income - expense;

  const topCategories = useMemo(() => {
    return categoryBreakdown.slice(0, 5);
  }, [categoryBreakdown]);

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-green-500/10 p-3 text-center">
          <ArrowUpCircle className="mx-auto mb-1 h-5 w-5 text-green-600" />
          <p className="text-xs text-muted-foreground">{t('transactions.income')}</p>
          <p className="text-sm font-bold text-green-600">{formatAmount(income)}</p>
        </div>
        <div className="rounded-xl bg-red-500/10 p-3 text-center">
          <ArrowDownCircle className="mx-auto mb-1 h-5 w-5 text-red-600" />
          <p className="text-xs text-muted-foreground">{t('transactions.expense')}</p>
          <p className="text-sm font-bold text-red-600">{formatAmount(expense)}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${net >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
          <TrendingUp className={`mx-auto mb-1 h-5 w-5 ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={`text-sm font-bold ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatAmount(Math.abs(net))}
          </p>
        </div>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-semibold">{t('budget.management')}</h4>
          <div className="space-y-2">
            {topCategories.map(({ category, amount }) => {
              const cat = EXPENSE_CATEGORIES.find((c) => c.id === category);
              const pct = expense > 0 ? (amount / expense) * 100 : 0;
              return (
                <div key={category} className="flex items-center gap-3">
                  <CategoryIcon name={cat?.icon || 'package'} size={20} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat?.label || category}</span>
                      <span className="font-medium">{formatAmount(amount)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
