/**
 * useWebNotifications
 * Web platformda (non-native) calisan bildirim uretici.
 * Capacitor push notification'lar web'de calismadigi icin,
 * bu hook kart/kredi verilerini analiz edip dogrudan inbox'a bildirim ekler.
 * Gunluk 1 kez calisir (dedup via localStorage tarih kontrolu).
 */
import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { CreditCard } from '@/types/finance';
import { Loan } from '@/types/loan';
import { useNotificationInbox } from '@/hooks/useNotificationInbox';
import { differenceInDays, isBefore, isSameDay, startOfDay, addDays } from 'date-fns';

const LAST_CHECK_KEY = 'kredi-pusula-web-notif-last-check';
const REMINDER_DAYS = 3;

export function useWebNotifications(cards: CreditCard[], loans: Loan[]) {
  const { addNotification } = useNotificationInbox();
  const hasRun = useRef(false);

  const generateNotifications = useCallback(() => {
    // Native platformda push zaten calisiyor — web hook'a gerek yok
    if (Capacitor.isNativePlatform()) return;

    // Gunluk dedup: bugun zaten calistiysa atla
    const today = startOfDay(new Date()).toISOString().slice(0, 10); // YYYY-MM-DD
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck === today) return;

    const now = startOfDay(new Date());
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // --- Kredi Karti Bildirimleri ---
    cards.forEach((card) => {
      if (card.currentDebt <= 0) return;

      const futureDue = new Date(currentYear, currentMonth, card.dueDate);
      if (isBefore(futureDue, now)) {
        futureDue.setMonth(futureDue.getMonth() + 1);
      }

      const daysUntilDue = differenceInDays(futureDue, now);

      // 1. Vadesi gecmis — son odeme gunu gecmis ve borc var
      const pastDue = new Date(currentYear, currentMonth, card.dueDate);
      if (isBefore(pastDue, now) && !isSameDay(pastDue, now)) {
        const daysOverdue = differenceInDays(now, pastDue);
        if (daysOverdue > 0 && daysOverdue <= 30) {
          addNotification({
            title: `${card.bankName} - Ödeme Gecikmiş`,
            message: `${card.cardName} için son ödeme tarihi ${daysOverdue} gün önce geçti. Borç: ${card.currentDebt.toLocaleString('tr-TR')} TL`,
            type: 'overdue',
            severity: 'danger',
            assetType: 'card',
            assetId: card.id,
          });
        }
      }

      // 2. Bugun son odeme gunu
      if (isSameDay(futureDue, now)) {
        addNotification({
          title: `${card.bankName} - Bugün Son Ödeme Günü`,
          message: `${card.cardName} için bugün son ödeme günü. Borç: ${card.currentDebt.toLocaleString('tr-TR')} TL`,
          type: 'payment',
          severity: 'danger',
          assetType: 'card',
          assetId: card.id,
        });
      }

      // 3. Odeme yaklasma (1-3 gun)
      if (daysUntilDue > 0 && daysUntilDue <= REMINDER_DAYS) {
        addNotification({
          title: `${card.bankName} - Ödeme Yaklaşıyor`,
          message: `${card.cardName} için ${daysUntilDue} gün kaldı. Borç: ${card.currentDebt.toLocaleString('tr-TR')} TL`,
          type: 'payment',
          severity: 'warning',
          assetType: 'card',
          assetId: card.id,
        });
      }

      // 4. Altin pencere — ekstre tarihi sonrasi gun = bugun
      const statementDate = new Date(currentYear, currentMonth, card.statementDate);
      if (isBefore(statementDate, now)) {
        statementDate.setMonth(statementDate.getMonth() + 1);
      }
      const goldenWindowStart = addDays(statementDate, 1);
      if (isSameDay(goldenWindowStart, now)) {
        addNotification({
          title: `${card.bankName} - Altın Pencere Açıldı`,
          message: `${card.cardName} için bugün alışveriş yaparsanız 40+ gün vade kazanabilirsiniz.`,
          type: 'golden',
          severity: 'info',
          assetType: 'card',
          assetId: card.id,
        });
      }
    });

    // --- Kredi (Loan) Bildirimleri ---
    loans.forEach((loan) => {
      if (loan.isPaid) return;

      const loanDueDate = new Date(currentYear, currentMonth, loan.dueDay);
      if (isBefore(loanDueDate, now)) {
        loanDueDate.setMonth(loanDueDate.getMonth() + 1);
      }

      const daysUntilLoan = differenceInDays(loanDueDate, now);

      // Vadesi gecmis kredi
      if (loan.isOverdue && loan.overdueDays > 0) {
        addNotification({
          title: `${loan.bankName} - Kredi Taksiti Gecikmiş`,
          message: `${loan.name} ${loan.overdueDays} gündür bekliyor. Taksit: ${loan.monthlyPayment.toLocaleString('tr-TR')} TL`,
          type: 'overdue',
          severity: 'danger',
          assetType: 'loan',
          assetId: loan.id,
        });
      }

      // Kredi odemesi yaklasma
      if (daysUntilLoan > 0 && daysUntilLoan <= REMINDER_DAYS) {
        addNotification({
          title: `${loan.bankName} - Kredi Ödemesi Yaklaşıyor`,
          message: `${loan.name} için ${daysUntilLoan} gün kaldı. Taksit: ${loan.monthlyPayment.toLocaleString('tr-TR')} TL`,
          type: 'payment',
          severity: 'warning',
          assetType: 'loan',
          assetId: loan.id,
        });
      }

      // Bugun kredi odeme gunu
      if (isSameDay(loanDueDate, now)) {
        addNotification({
          title: `${loan.bankName} - Bugün Taksit Günü`,
          message: `${loan.name} için bugün taksit ödeme günü. Taksit: ${loan.monthlyPayment.toLocaleString('tr-TR')} TL`,
          type: 'payment',
          severity: 'danger',
          assetType: 'loan',
          assetId: loan.id,
        });
      }
    });

    // Basarili — bugunu kaydet
    localStorage.setItem(LAST_CHECK_KEY, today);
  }, [cards, loans, addNotification]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Kisa gecikme — sayfa yuklenirken spam onlemek icin
    const timer = setTimeout(() => {
      generateNotifications();
    }, 1500);

    return () => clearTimeout(timer);
  }, [generateNotifications]);
}
