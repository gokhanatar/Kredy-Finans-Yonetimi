import { useTranslation } from 'react-i18next';
import { RecurringExpense, DAY_LABELS } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';

interface RecurringExpenseListProps {
  expenses: RecurringExpense[];
  dailyCost: number;
  monthlyCost: number;
  onAdd: () => void;
  onEdit: (expense: RecurringExpense) => void;
  onToggle: (id: string) => void;
}

export function RecurringExpenseList({
  expenses,
  dailyCost,
  monthlyCost,
  onAdd,
  onEdit,
  onToggle,
}: RecurringExpenseListProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount } = usePrivacyMode();

  return (
    <div className="space-y-3">
      {/* Cost Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-orange-500/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('incomeSection.dailyRecurring')}</p>
          <p className="text-lg font-bold text-orange-600">{formatAmount(dailyCost)}</p>
        </div>
        <div className="rounded-xl bg-orange-500/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('subscriptions.monthlyCost')}</p>
          <p className="text-lg font-bold text-orange-600">{formatAmount(monthlyCost)}</p>
        </div>
      </div>

      {/* Expense Items */}
      {expenses.map((exp) => (
        <div
          key={exp.id}
          className={`rounded-xl bg-card p-3 shadow-sm ${!exp.isActive ? 'opacity-50' : ''}`}
        >
          <div className="flex items-center gap-3">
            <CategoryIcon name={exp.icon} size={24} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{exp.name}</p>
              <div className="flex gap-0.5 mt-1">
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <span
                    key={d}
                    className={`text-[9px] rounded px-1 ${
                      exp.activeDays.includes(d)
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'text-muted-foreground/40'
                    }`}
                  >
                    {DAY_LABELS[d]}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatAmount(exp.dailyAmount)}</p>
              <p className="text-[10px] text-muted-foreground">{t('common:time.perDay')}</p>
            </div>
            <Switch checked={exp.isActive} onCheckedChange={() => onToggle(exp.id)} />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(exp)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}

      {expenses.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {t('incomeSection.noSystematic')}
        </div>
      )}

      <Button variant="outline" className="w-full gap-2" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {t('incomeSection.addIncome')}
      </Button>
    </div>
  );
}
