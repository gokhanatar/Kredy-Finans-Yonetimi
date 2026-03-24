import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Budget, BudgetCategory } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Check, Plus, Trash2 } from 'lucide-react';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';

interface BudgetOverviewProps {
  budget: Budget | undefined;
  safeToSpend: number;
  unallocated: number;
  overBudgetCategories: BudgetCategory[];
  onCreateBudget: (month: number, year: number, income: number) => void;
  onUpdateAllocation: (budgetId: string, categoryId: string, amount: number) => void;
  onUpdateIncome: (budgetId: string, income: number) => void;
  onAddCategory: (budgetId: string, category: Omit<BudgetCategory, 'id'>) => void;
  onRemoveCategory: (budgetId: string, categoryId: string) => void;
}

export function BudgetOverview({
  budget,
  safeToSpend,
  unallocated,
  overBudgetCategories,
  onCreateBudget,
  onUpdateAllocation,
  onUpdateIncome,
  onAddCategory,
  onRemoveCategory,
}: BudgetOverviewProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount } = usePrivacyMode();
  const [newIncome, setNewIncome] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  if (!budget) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-card p-6 text-center shadow-sm">
          <h3 className="text-lg font-bold mb-2">{t('budget.title')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('budget.subtitle')}
          </p>
          <Input
            type="text"
            inputMode="decimal"
            value={newIncome}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
              setNewIncome(cleaned);
            }}
            onBlur={() => {
              if (newIncome) {
                const parsed = parseTurkishNumber(newIncome);
                if (parsed > 0) setNewIncome(formatNumber(parsed));
              }
            }}
            placeholder={t('budget.incomePlaceholder')}
            className="mb-3"
          />
          <Button
            onClick={() => {
              const income = parseTurkishNumber(newIncome);
              if (income > 0) {
                const now = new Date();
                onCreateBudget(now.getMonth(), now.getFullYear(), income);
              }
            }}
            className="w-full"
          >
            {t('budget.createBudget')}
          </Button>
        </div>
      </div>
    );
  }

  const totalAllocated = budget.categories.reduce((s, c) => s + c.allocated, 0);
  const totalSpent = budget.categories.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="space-y-3">
      {/* Safe to Spend */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 p-4">
        <p className="text-xs text-muted-foreground">{t('budget.safeToSpend')}</p>
        <p className={`text-2xl font-bold ${safeToSpend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {formatAmount(safeToSpend)}
        </p>
      </div>

      {/* Budget Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-card p-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">{t('budget.income')}</p>
          <p className="text-xs font-bold">{formatAmount(budget.totalIncome)}</p>
        </div>
        <div className="rounded-lg bg-card p-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">{t('budget.allocated')}</p>
          <p className="text-xs font-bold">{formatAmount(totalAllocated)}</p>
        </div>
        <div className="rounded-lg bg-card p-2 shadow-sm">
          <p className="text-[10px] text-muted-foreground">{t('budget.spent')}</p>
          <p className="text-xs font-bold">{formatAmount(totalSpent)}</p>
        </div>
      </div>

      {/* Unallocated Warning */}
      {unallocated > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-2 text-xs text-yellow-700">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('budget.unallocated', { amount: formatAmount(unallocated) })}</span>
        </div>
      )}

      {/* Over Budget Warnings */}
      {overBudgetCategories.length > 0 && (
        <div className="rounded-lg bg-red-500/10 p-2 text-xs text-red-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">{t('budget.overBudget')}</span>
          </div>
          {overBudgetCategories.map((c) => (
            <p key={c.id} className="flex items-center gap-1"><CategoryIcon name={c.icon} size={14} /> {t('budget.overBudgetFormat', { name: c.name, amount: formatAmount(c.spent - c.allocated) })}</p>
          ))}
        </div>
      )}

      {/* Category Budgets */}
      <div className="space-y-2">
        {budget.categories.map((cat) => {
          const pct = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
          const isOver = cat.spent > cat.allocated && cat.allocated > 0;
          return (
            <div key={cat.id} className="rounded-xl bg-card p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <CategoryIcon name={cat.icon} size={16} />
                <span className="text-sm font-medium flex-1">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatAmount(cat.spent)} / {formatAmount(cat.allocated)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemoveCategory(budget.id, cat.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              <Progress
                value={Math.min(100, pct)}
                className={`h-2 ${isOver ? '[&>div]:bg-red-500' : ''}`}
              />
              <div className="mt-1">
                <Input
                  type="text"
                  inputMode="decimal"
                  defaultValue={cat.allocated ? formatNumber(cat.allocated) : ''}
                  onBlur={(e) => {
                    const raw = e.target.value;
                    const parsed = raw === '' ? 0 : parseTurkishNumber(raw);
                    onUpdateAllocation(budget.id, cat.id, parsed);
                    if (parsed > 0) e.target.value = formatNumber(parsed);
                  }}
                  onChange={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9.,]/g, '');
                  }}
                  placeholder={t('budget.allocationPlaceholder')}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Category */}
      {showAddCategory ? (
        <div className="flex gap-2">
          <Input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder={t('budget.categoryPlaceholder')}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => {
              if (newCatName.trim()) {
                onAddCategory(budget.id, {
                  name: newCatName.trim(),
                  allocated: 0,
                  spent: 0,
                  icon: 'package',
                  color: 'bg-gray-500',
                });
                setNewCatName('');
                setShowAddCategory(false);
              }
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowAddCategory(true)}>
          <Plus className="h-4 w-4" />
          {t('budget.addCategory')}
        </Button>
      )}
    </div>
  );
}
