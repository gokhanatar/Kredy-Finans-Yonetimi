import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiggyBank, Check, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStorageForScope } from '@/hooks/useStorageForScope';
import { useBudget } from '@/hooks/useBudget';
import { PERSONAL_STORAGE_KEYS, FamilyTransaction } from '@/types/familyFinance';
import { suggestBudget, suggestSavings } from '@/lib/budgetSuggestion';
import { formatCurrency } from '@/lib/financeUtils';
import { toast } from '@/hooks/use-toast';
import { CategoryIcon } from '@/components/ui/category-icon';
import { EXPENSE_CATEGORIES } from '@/types/familyFinance';

function getCategoryIcon(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.id === category);
  return found?.icon || 'package';
}

const BudgetSuggestionCard = () => {
  const { t } = useTranslation(['ai', 'family']);
  const [transactions] = useStorageForScope<FamilyTransaction[]>(
    PERSONAL_STORAGE_KEYS.TRANSACTIONS,
    [],
    'personal'
  );
  const { currentBudget, createBudget, updateCategoryAllocation } = useBudget(
    PERSONAL_STORAGE_KEYS.BUDGETS,
    'personal'
  );
  const [applied, setApplied] = useState(false);

  const suggestions = useMemo(() => suggestBudget(transactions, 3), [transactions]);

  const monthlyIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return transactions
      .filter((tx) => {
        const d = new Date(tx.date);
        return tx.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return transactions
      .filter((tx) => {
        const d = new Date(tx.date);
        return tx.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const savings = useMemo(
    () => suggestSavings(monthlyIncome, monthlyExpenses),
    [monthlyIncome, monthlyExpenses]
  );

  const handleApply = () => {
    const now = new Date();
    let budget = currentBudget;

    if (!budget) {
      budget = createBudget(now.getMonth(), now.getFullYear(), monthlyIncome || 0);
    }

    if (!budget) return;

    for (const suggestion of suggestions) {
      const matchedCategory = budget.categories.find(
        (c) => c.name.toLowerCase() === suggestion.category.toLowerCase()
      );
      if (matchedCategory) {
        updateCategoryAllocation(budget.id, matchedCategory.id, suggestion.suggestedAmount);
      }
    }

    setApplied(true);
    toast({
      title: t('ai:budget.applied'),
      description: t('ai:budget.appliedDesc'),
    });
  };

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <PiggyBank className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t('ai:budget.noData')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const confidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-success/15 text-success';
      case 'medium':
        return 'bg-warning/15 text-warning';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const confidenceLabel = (level: string) => {
    switch (level) {
      case 'high':
        return t('ai:budget.confidenceHigh');
      case 'medium':
        return t('ai:budget.confidenceMedium');
      case 'low':
        return t('ai:budget.confidenceLow');
      default:
        return level;
    }
  };

  const needsPercent = Math.min(((monthlyExpenses * 0.5) / (monthlyIncome || 1)) * 100, 100);
  const wantsPercent = Math.min(((monthlyExpenses * 0.3) / (monthlyIncome || 1)) * 100, 100);
  const savingsPercent = Math.min(
    (((monthlyIncome - monthlyExpenses) / (monthlyIncome || 1)) * 100),
    100
  );

  return (
    <div className="space-y-4">
      {/* Budget Suggestion Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="h-5 w-5 text-primary" />
            {t('ai:budget.suggestedBudget')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('ai:budget.basedOn', { months: 3 })} &middot; {t('ai:budget.safetyMargin')}
          </p>
        </CardHeader>
        <CardContent className="px-0">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-2 border-b px-4 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>{t('ai:budget.category')}</span>
            <span className="text-right">{t('ai:budget.average')}</span>
            <span className="text-right">{t('ai:budget.suggested')}</span>
            <span className="text-right">{t('ai:budget.confidence')}</span>
          </div>

          {/* Table rows */}
          <div className="divide-y">
            {suggestions.map((item) => (
              <div
                key={item.category}
                className="grid grid-cols-4 items-center gap-2 px-4 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CategoryIcon
                    name={getCategoryIcon(item.category)}
                    size={14}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="text-xs font-medium truncate">{item.category}</span>
                </div>
                <span className="text-right text-xs text-muted-foreground">
                  {formatCurrency(item.averageSpend)}
                </span>
                <span className="text-right text-xs font-semibold">
                  {formatCurrency(item.suggestedAmount)}
                </span>
                <div className="flex justify-end">
                  <Badge
                    variant="secondary"
                    className={`text-[9px] px-1.5 py-0 ${confidenceColor(item.confidence)}`}
                  >
                    {confidenceLabel(item.confidence)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Apply button */}
          <div className="mt-3 px-4">
            <Button
              onClick={handleApply}
              disabled={applied}
              className="w-full gap-2"
              size="sm"
            >
              {applied ? (
                <>
                  <Check className="h-4 w-4" />
                  {t('ai:budget.applied')}
                </>
              ) : (
                t('ai:budget.apply')
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 50/30/20 Savings Visualization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-primary" />
            {t('ai:budget.savingsTitle')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t('ai:budget.savingsRule')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Needs bar */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium">{t('ai:budget.needs')}</span>
              <span className="text-xs text-muted-foreground">
                {monthlyIncome > 0 ? formatCurrency(monthlyIncome * 0.5) : '-'}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(needsPercent, 0)}%` }}
              />
            </div>
          </div>

          {/* Wants bar */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium">{t('ai:budget.wants')}</span>
              <span className="text-xs text-muted-foreground">
                {monthlyIncome > 0 ? formatCurrency(monthlyIncome * 0.3) : '-'}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-warning transition-all duration-500"
                style={{ width: `${Math.max(wantsPercent, 0)}%` }}
              />
            </div>
          </div>

          {/* Savings bar */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium">{t('ai:budget.savingsTarget')}</span>
              <span className="text-xs text-muted-foreground">
                {monthlyIncome > 0 ? formatCurrency(monthlyIncome * 0.2) : '-'}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all duration-500"
                style={{ width: `${Math.max(savingsPercent, 0)}%` }}
              />
            </div>
          </div>

          {/* Tips */}
          {savings.tips.length > 0 && (
            <div className="mt-3 space-y-2">
              {savings.tips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg bg-muted/50 p-3"
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetSuggestionCard;
