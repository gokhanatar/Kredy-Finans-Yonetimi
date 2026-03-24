import { useTranslation } from 'react-i18next';
import { Goal } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { Button } from '@/components/ui/button';
import { Pencil, Target, Calendar } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onContribute: (goalId: string) => void;
}

export function GoalCard({ goal, onEdit, onContribute }: GoalCardProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount } = usePrivacyMode();
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  const daysLeft = goal.deadline
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${goal.color}`}>
          <CategoryIcon name={goal.icon} size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold truncate">{goal.name}</h4>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(goal)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Progress Ring */}
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-14 w-14">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-secondary" />
                <circle
                  cx="28" cy="28" r="24" fill="none" strokeWidth="4"
                  stroke={isCompleted ? '#22c55e' : '#6366f1'}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - Math.min(1, progress / 100))}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}
              </p>
              {daysLeft !== null && daysLeft > 0 && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{t('goals.daysLeft', { days: daysLeft })}</span>
                </div>
              )}
              {isCompleted && (
                <span className="mt-1 inline-block rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                  {t('goals.completed')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isCompleted && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full gap-2"
          onClick={() => onContribute(goal.id)}
        >
          <Target className="h-4 w-4" />
          {t('goals.addMoney')}
        </Button>
      )}
    </div>
  );
}
