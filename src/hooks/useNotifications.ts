import { useEffect, useCallback } from "react";
import { CreditCard } from "@/types/finance";
import { toast } from "@/hooks/use-toast";
import { addDays, differenceInDays, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";

interface NotificationConfig {
  paymentWarningDays: number; // Days before payment to warn
  goldenWindowNotify: boolean; // Notify on golden window days
}

const defaultConfig: NotificationConfig = {
  paymentWarningDays: 3,
  goldenWindowNotify: true,
};

const TOAST_DEDUP_KEY = 'kredi-pusula-toast-notif-last-check';

export function useNotifications(cards: CreditCard[], config: NotificationConfig = defaultConfig) {
  const checkNotifications = useCallback(() => {
    // Daily dedup: only show toast notifications once per day
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastCheck = localStorage.getItem(TOAST_DEDUP_KEY);
    if (lastCheck === todayStr) return;

    const today = startOfDay(new Date());
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    cards.forEach((card) => {
      // Calculate due date
      const dueDate = new Date(currentYear, currentMonth, card.dueDate);
      // If due date has passed this month, check next month
      if (isBefore(dueDate, today)) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const daysUntilDue = differenceInDays(dueDate, today);

      // Payment warning
      if (daysUntilDue > 0 && daysUntilDue <= config.paymentWarningDays) {
        toast({
          title: "⚠️ Ödeme Yaklaşıyor",
          description: `${card.bankName} ${card.cardName} için ${daysUntilDue} gün kaldı!`,
          variant: "destructive",
        });
      }

      // Due date is today
      if (isSameDay(dueDate, today)) {
        toast({
          title: "🚨 Bugün Son Ödeme!",
          description: `${card.bankName} ${card.cardName} için bugün son ödeme günü!`,
          variant: "destructive",
        });
      }

      // Golden window notification
      if (config.goldenWindowNotify) {
        const statementDate = new Date(currentYear, currentMonth, card.statementDate);
        if (isBefore(statementDate, today)) {
          statementDate.setMonth(statementDate.getMonth() + 1);
        }
        
        const goldenWindowStart = addDays(statementDate, 1);
        
        if (isSameDay(goldenWindowStart, today)) {
          toast({
            title: "🌟 Altın Pencere Açıldı!",
            description: `${card.bankName} ${card.cardName} için bugün alışveriş yapın, 40+ gün vade kazanın!`,
          });
        }
      }

      // Interest accruing warning (if past due date and has balance)
      if (isAfter(today, dueDate) && card.currentDebt > 0) {
        const daysOverdue = differenceInDays(today, dueDate);
        if (daysOverdue <= 7) {
          const dailyInterestRate = 0.0311 / 30; // ~3.11% monthly
          const dailyInterest = card.currentDebt * dailyInterestRate;
          
          toast({
            title: "💸 Faiz İşliyor!",
            description: `${card.bankName} için günlük ~₺${dailyInterest.toFixed(2)} faiz işliyor!`,
            variant: "destructive",
          });
        }
      }
    });

    // Mark today as checked
    localStorage.setItem(TOAST_DEDUP_KEY, todayStr);
  }, [cards, config]);

  // Check notifications on mount and when cards change
  useEffect(() => {
    // Delay notification check to avoid spam on page load
    const timer = setTimeout(() => {
      checkNotifications();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkNotifications]);

  return { checkNotifications };
}
