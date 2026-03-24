import { useMemo } from 'react';
import { CreditCard } from '@/types/finance';
import { formatCurrency } from '@/lib/financeUtils';
import { usePrivacyModeContext } from '@/contexts/PrivacyModeContext';
import { Subscription, RecurringBill } from '@/types/familyFinance';
import { Clock, CreditCard as CreditCardIcon, Receipt, Repeat, CheckCircle2 } from 'lucide-react';

interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  daysUntil: number;
  type: 'card' | 'bill' | 'subscription';
}

const TYPE_ICON_MAP = {
  card: { icon: CreditCardIcon, color: 'bg-blue-500/10 text-blue-500' },
  bill: { icon: Receipt, color: 'bg-orange-500/10 text-orange-500' },
  subscription: { icon: Repeat, color: 'bg-violet-500/10 text-violet-500' },
};

interface SimpleUpcomingPaymentsProps {
  cards: CreditCard[];
  bills?: RecurringBill[];
  subscriptions?: Subscription[];
  daysAhead?: number;
}

export function SimpleUpcomingPayments({
  cards,
  bills = [],
  subscriptions = [],
  daysAhead = 3,
}: SimpleUpcomingPaymentsProps) {
  const { isPrivate } = usePrivacyModeContext();

  const upcoming = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const result: UpcomingPayment[] = [];

    // Card payments
    cards.forEach((card) => {
      if (card.currentDebt <= 0) return;
      let daysUntil = card.dueDate - currentDay;
      if (daysUntil < 0) daysUntil += daysInMonth;
      if (daysUntil <= daysAhead) {
        result.push({
          id: `card-${card.id}`,
          name: `${card.bankName} ${card.cardName}`,
          amount: card.minimumPayment || card.currentDebt,
          daysUntil,
          type: 'card',
        });
      }
    });

    // Recurring bills
    bills.forEach((bill) => {
      if (!bill.isActive || bill.frequency !== 'monthly' || !bill.dayOfMonth) return;
      let daysUntil = bill.dayOfMonth - currentDay;
      if (daysUntil < 0) daysUntil += daysInMonth;
      if (daysUntil <= daysAhead) {
        result.push({
          id: `bill-${bill.id}`,
          name: bill.name,
          amount: bill.fixedAmount || bill.lastPaidAmount || 0,
          daysUntil,
          type: 'bill',
        });
      }
    });

    // Subscriptions
    subscriptions.forEach((sub) => {
      if (!sub.isActive) return;
      let daysUntil = sub.billingDate - currentDay;
      if (daysUntil < 0) daysUntil += daysInMonth;
      if (daysUntil <= daysAhead) {
        result.push({
          id: `sub-${sub.id}`,
          name: sub.name,
          amount: sub.amount,
          daysUntil,
          type: 'subscription',
        });
      }
    });

    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [cards, bills, subscriptions, daysAhead]);

  // Empty state — all clear
  if (upcoming.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 px-1">
          <Clock className="h-4 w-4" /> Yaklaşan Ödemeler
        </h3>
        <div className="flex items-center gap-3 rounded-2xl bg-success/10 border border-success/20 px-4 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <p className="text-sm font-medium text-success">Her şey yolunda, yakın ödeme yok!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 px-1">
        <Clock className="h-4 w-4" /> Yaklaşan Ödemeler
      </h3>
      <div className="rounded-2xl bg-warning/10 border border-warning/20 divide-y divide-warning/10 overflow-hidden">
        {upcoming.map((item) => {
          const typeConfig = TYPE_ICON_MAP[item.type];
          const Icon = typeConfig.icon;
          const isToday = item.daysUntil === 0;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${isToday ? 'animate-pulse' : ''}`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${typeConfig.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold tabular-nums">
                  {isPrivate ? '••••' : formatCurrency(item.amount)}
                </span>
                <span className={`text-xs font-medium whitespace-nowrap px-1.5 py-0.5 rounded-full ${
                  isToday
                    ? 'bg-destructive/15 text-destructive font-bold'
                    : 'text-warning'
                }`}>
                  {isToday ? 'Bugün!' : `${item.daysUntil} gün`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
