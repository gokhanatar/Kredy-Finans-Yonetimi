import { useTranslation } from 'react-i18next';
import { Subscription, SUBSCRIPTION_CATEGORIES } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Calendar } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';
import { format, addMonths, addWeeks, addYears } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  monthlyCost: number;
  yearlyCost: number;
  onAdd: () => void;
  onEdit: (sub: Subscription) => void;
  onToggle: (id: string) => void;
}

function getNextBilling(billingDate: number, cycle: Subscription['billingCycle']): Date {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const maxDay = new Date(y, m + 1, 0).getDate();
  const day = Math.min(billingDate, maxDay);
  let next = new Date(y, m, day);

  if (next <= now) {
    if (cycle === 'weekly') next = addWeeks(next, 1);
    else if (cycle === 'monthly') next = addMonths(next, 1);
    else next = addYears(next, 1);
  }
  return next;
}

export function SubscriptionList({
  subscriptions,
  monthlyCost,
  yearlyCost,
  onAdd,
  onEdit,
  onToggle,
}: SubscriptionListProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount } = usePrivacyMode();

  const cycleLabel = (cycle: Subscription['billingCycle']) => {
    switch (cycle) {
      case 'weekly': return t('subscriptions.cycles.weekly');
      case 'monthly': return t('subscriptions.cycles.monthly');
      case 'yearly': return t('subscriptions.cycles.yearly');
    }
  };

  return (
    <div className="space-y-3">
      {/* Cost Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-purple-500/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('subscriptions.monthlyCost')}</p>
          <p className="text-lg font-bold text-purple-600">{formatAmount(monthlyCost)}</p>
        </div>
        <div className="rounded-xl bg-purple-500/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('subscriptions.yearlyCost')}</p>
          <p className="text-lg font-bold text-purple-600">{formatAmount(yearlyCost)}</p>
        </div>
      </div>

      {/* Subscription Items */}
      {subscriptions.map((sub) => {
        const cat = SUBSCRIPTION_CATEGORIES.find((c) => c.id === sub.category);
        const nextDate = getNextBilling(sub.billingDate, sub.billingCycle);
        return (
          <div
            key={sub.id}
            className={`rounded-xl bg-card p-3 shadow-sm ${!sub.isActive ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <CategoryIcon name={sub.icon} size={24} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{sub.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{cycleLabel(sub.billingCycle)}</span>
                  <span>•</span>
                  <Calendar className="h-3 w-3" />
                  <span>{format(nextDate, 'd MMM', { locale: tr })}</span>
                </div>
              </div>
              <span className="text-sm font-semibold">{formatAmount(sub.amount)}</span>
              <Switch checked={sub.isActive} onCheckedChange={() => onToggle(sub.id)} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(sub)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}

      {subscriptions.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {t('subscriptions.noSubscriptions')}
        </div>
      )}

      <Button variant="outline" className="w-full gap-2" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {t('subscriptions.addSubscription')}
      </Button>
    </div>
  );
}
