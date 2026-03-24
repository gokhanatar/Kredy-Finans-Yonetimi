import { useEffect, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { CreditCard, FINANCIAL_CONSTANTS } from '@/types/finance';
import { Loan } from '@/types/loan';
import { addDays, differenceInDays, isBefore, startOfDay, setHours, setMinutes, subDays, addMonths, getMonth, getYear, setDate, parseISO, format, getDaysInMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Budget, Goal, RecurringExpense, Subscription, CategorySpendingLimit, FAMILY_STORAGE_KEYS, PERSONAL_STORAGE_KEYS, RecurringBill, Account, KMH_CONSTANTS } from '@/types/familyFinance';
import { calculateCardDailyInterest, calculateLoanDailyInterest } from '@/lib/overdueUtils';
import { Property, Vehicle } from '@/types/assetTypes';
import { Investment } from '@/types/investment';

interface NotificationSettings {
  enabled: boolean;
  paymentReminder: boolean;
  goldenWindowAlert: boolean;
  statementReminder: boolean;
  reminderDaysBefore: number;
  reminderTime: { hour: number; minute: number };
  // Vergi hatırlatıcı ayarları
  taxReminder: boolean;
  kdvReminderDays: number;
  quarterlyTaxReminder: boolean;
  // Gecikme bildirimi ayarları
  overdueReminder: boolean;
  overdueNotificationFrequency: 'daily' | 'every_3_days' | 'weekly';
  overdueNotificationTime: { hour: number; minute: number };
  // Kredi bildirimleri
  loanPaymentReminder: boolean;
  loanReminderDays: number;
  // Aile finansı bildirimleri
  budgetAlert: boolean;
  goalReminder: boolean;
  recurringExpenseReminder: boolean;
  subscriptionRenewalReminder: boolean;
  // Yatırım bildirimleri
  investmentPriceAlert: boolean;
  // Varlık vergi
  propertyTaxReminder: boolean;
  mtvReminder: boolean;
  // Araç & Gayrimenkul hatırlatmaları
  vehicleInspectionReminder: boolean;
  rentDueReminder: boolean;
  contractRenewalReminder: boolean;
  // Fatura hatırlatması
  recurringBillReminder: boolean;
  // KMH (Kredili Mevduat Hesabı) faiz bildirimi
  kmhInterestReminder: boolean;
  // Aile aktivite bildirimi (üye harcama, gelir, bütçe vs.)
  familyActivityNotification: boolean;
}

// All toggle keys (excluding non-toggle fields)
export const NOTIFICATION_TOGGLE_KEYS: (keyof NotificationSettings)[] = [
  'paymentReminder',
  'goldenWindowAlert',
  'statementReminder',
  'overdueReminder',
  'loanPaymentReminder',
  'taxReminder',
  'quarterlyTaxReminder',
  'propertyTaxReminder',
  'mtvReminder',
  'budgetAlert',
  'goalReminder',
  'recurringExpenseReminder',
  'subscriptionRenewalReminder',
  'investmentPriceAlert',
  'vehicleInspectionReminder',
  'rentDueReminder',
  'contractRenewalReminder',
  'recurringBillReminder',
  'kmhInterestReminder',
  'familyActivityNotification',
];

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  paymentReminder: true,
  goldenWindowAlert: true,
  statementReminder: true,
  reminderDaysBefore: 3,
  reminderTime: { hour: 9, minute: 0 },
  // Vergi hatırlatıcı varsayılanları
  taxReminder: false,
  kdvReminderDays: 5,
  quarterlyTaxReminder: true,
  // Gecikme bildirimi varsayılanları
  overdueReminder: true,
  overdueNotificationFrequency: 'daily',
  overdueNotificationTime: { hour: 10, minute: 0 },
  // Kredi bildirimi varsayılanları
  loanPaymentReminder: true,
  loanReminderDays: 3,
  // Aile finansı varsayılanları
  budgetAlert: true,
  goalReminder: true,
  recurringExpenseReminder: true,
  subscriptionRenewalReminder: true,
  // Yatırım varsayılanları
  investmentPriceAlert: true,
  // Varlık vergi varsayılanları
  propertyTaxReminder: true,
  mtvReminder: true,
  // Araç & Gayrimenkul hatırlatma varsayılanları
  vehicleInspectionReminder: true,
  rentDueReminder: true,
  contractRenewalReminder: true,
  // Fatura hatırlatma varsayılanı
  recurringBillReminder: true,
  // KMH faiz bildirimi varsayılanı
  kmhInterestReminder: true,
  // Aile aktivite varsayılanı
  familyActivityNotification: true,
};

export function usePushNotifications(cards: CreditCard[], loans: Loan[] = []) {
  const { t } = useTranslation(['notifications']);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const stored = localStorage.getItem('kredi-pusula-notification-settings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check and request permissions
  const requestPermissions = useCallback(async () => {
    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Notifications not available (web mode):', error);
      return false;
    }
  }, []);

  // Schedule payment reminder notifications
  const schedulePaymentReminders = useCallback(async () => {
    if (!settings.enabled || !settings.paymentReminder || !permissionGranted) return;

    try {
      // Cancel existing notifications first
      await LocalNotifications.cancel({ notifications: cards.map((_, i) => ({ id: 1000 + i })) });

      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };

      cards.forEach((card, index) => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Calculate due date
        let dueDate = new Date(currentYear, currentMonth, card.dueDate);
        if (isBefore(dueDate, today)) {
          dueDate = new Date(currentYear, currentMonth + 1, card.dueDate);
        }

        const reminderDate = addDays(dueDate, -settings.reminderDaysBefore);
        
        // Only schedule if reminder date is in the future
        if (differenceInDays(reminderDate, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          const debtFormatted = card.currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          const dateFormatted = format(dueDate, 'd MMMM', { locale: tr });

          notifications.notifications.push({
            id: 1000 + index,
            title: t('notifications:push.paymentApproaching'),
            body: t('notifications:push.paymentApproachingBody', { bank: card.bankName, card: card.cardName, days: settings.reminderDaysBefore, amount: debtFormatted, date: dateFormatted }),
            schedule: { at: scheduleTime },
            sound: 'kredy_reminder.wav',
            actionTypeId: 'payment-reminder',
            extra: { cardId: card.id },
          });
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  }, [cards, settings, permissionGranted]);

  // Schedule golden window notifications
  const scheduleGoldenWindowAlerts = useCallback(async () => {
    if (!settings.enabled || !settings.goldenWindowAlert || !permissionGranted) return;

    try {
      await LocalNotifications.cancel({ notifications: cards.map((_, i) => ({ id: 2000 + i })) });

      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };

      cards.forEach((card, index) => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Calculate next statement date
        let statementDate = new Date(currentYear, currentMonth, card.statementDate);
        if (isBefore(statementDate, today)) {
          statementDate = new Date(currentYear, currentMonth + 1, card.statementDate);
        }

        // Golden window starts day after statement
        const goldenWindowStart = addDays(statementDate, 1);
        
        if (differenceInDays(goldenWindowStart, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(goldenWindowStart, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          // Approximate golden window days: ~30 days to next statement + gap from statement to due
          const gapDays = card.dueDate >= card.statementDate
            ? card.dueDate - card.statementDate
            : 30 - card.statementDate + card.dueDate;
          const goldenDays = 30 + gapDays;

          notifications.notifications.push({
            id: 2000 + index,
            title: t('notifications:push.goldenWindowOpen'),
            body: t('notifications:push.goldenWindowBody', { bank: card.bankName, card: card.cardName, days: goldenDays }),
            schedule: { at: scheduleTime },
            sound: 'kredy_positive.wav',
            actionTypeId: 'golden-window',
            extra: { cardId: card.id },
          });
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule golden window alerts:', error);
    }
  }, [cards, settings, permissionGranted]);

  // Calculate next KDV declaration date (26th of each month)
  const calculateNextKDVDate = useCallback(() => {
    const today = new Date();
    const { KDV_DECLARATION_DAY } = FINANCIAL_CONSTANTS.TAX_DEADLINES;
    
    let kdvDate = setDate(today, KDV_DECLARATION_DAY);
    
    // If we're past the 26th, move to next month
    if (today.getDate() > KDV_DECLARATION_DAY) {
      kdvDate = addMonths(kdvDate, 1);
    }
    
    return startOfDay(kdvDate);
  }, []);

  // Calculate next quarterly tax date (17th of Jan, Apr, Jul, Oct)
  const calculateNextQuarterlyTaxDate = useCallback(() => {
    const today = new Date();
    const { QUARTERLY_TAX_MONTHS, QUARTERLY_TAX_DAY } = FINANCIAL_CONSTANTS.TAX_DEADLINES;
    const currentMonth = getMonth(today);
    const currentYear = getYear(today);
    
    // Find the next quarterly tax month
    let nextQuarterMonth = QUARTERLY_TAX_MONTHS.find(m => m > currentMonth);
    let nextYear = currentYear;
    
    if (!nextQuarterMonth) {
      // Move to next year's first quarter
      nextQuarterMonth = QUARTERLY_TAX_MONTHS[0];
      nextYear = currentYear + 1;
    }
    
    // If we're in a quarter month but past the deadline day
    if (currentMonth === nextQuarterMonth - 1 && today.getDate() > QUARTERLY_TAX_DAY) {
      const nextIdx = QUARTERLY_TAX_MONTHS.indexOf(nextQuarterMonth) + 1;
      if (nextIdx < QUARTERLY_TAX_MONTHS.length) {
        nextQuarterMonth = QUARTERLY_TAX_MONTHS[nextIdx];
      } else {
        nextQuarterMonth = QUARTERLY_TAX_MONTHS[0];
        nextYear = currentYear + 1;
      }
    }
    
    const quarterDate = new Date(nextYear, nextQuarterMonth - 1, QUARTERLY_TAX_DAY);
    return startOfDay(quarterDate);
  }, []);

  // Schedule tax reminder notifications
  const scheduleTaxReminders = useCallback(async () => {
    if (!settings.enabled || !settings.taxReminder || !permissionGranted) return;

    try {
      // Cancel existing tax notifications (IDs 3000-3010)
      await LocalNotifications.cancel({ 
        notifications: Array.from({ length: 10 }, (_, i) => ({ id: 3000 + i })) 
      });

      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };

      // KDV beyanname bildirimi
      const nextKDVDate = calculateNextKDVDate();
      const kdvReminderDate = subDays(nextKDVDate, settings.kdvReminderDays);
      
      if (differenceInDays(kdvReminderDate, today) > 0) {
        const scheduleTime = setMinutes(
          setHours(kdvReminderDate, settings.reminderTime.hour),
          settings.reminderTime.minute
        );

        const kdvMonthName = format(nextKDVDate, 'MMMM', { locale: tr });

        notifications.notifications.push({
          id: 3000,
          title: t('notifications:push.kdvReminder'),
          body: t('notifications:push.kdvReminderBody', { days: settings.kdvReminderDays, month: kdvMonthName }),
          schedule: { at: scheduleTime },
          sound: 'kredy_warning.wav',
          actionTypeId: 'tax-reminder',
          extra: { type: 'kdv' },
        });
      }

      // Geçici vergi bildirimi
      if (settings.quarterlyTaxReminder) {
        const nextQuarterDate = calculateNextQuarterlyTaxDate();
        const quarterReminderDate = subDays(nextQuarterDate, settings.kdvReminderDays);
        
        if (differenceInDays(quarterReminderDate, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(quarterReminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          const quarterMonth = getMonth(nextQuarterDate) + 1;
          const quarterName = t(`notifications:push.quarterNames.${quarterMonth}`, { defaultValue: String(quarterMonth) });
          const quarterDaysLeft = differenceInDays(nextQuarterDate, today);

          notifications.notifications.push({
            id: 3001,
            title: t('notifications:push.quarterlyTaxReminder'),
            body: t('notifications:push.quarterlyTaxBody', { quarter: quarterName, days: quarterDaysLeft }),
            schedule: { at: scheduleTime },
            sound: 'kredy_warning.wav',
            actionTypeId: 'tax-reminder',
            extra: { type: 'quarterly' },
          });
        }
      }

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule tax reminders:', error);
    }
  }, [settings, permissionGranted, calculateNextKDVDate, calculateNextQuarterlyTaxDate]);

  // Schedule overdue notifications for cards and loans
  const scheduleOverdueNotifications = useCallback(async () => {
    if (!settings.enabled || !settings.overdueReminder || !permissionGranted) return;

    try {
      // Cancel existing overdue notifications (IDs 4000-4100)
      await LocalNotifications.cancel({ 
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 4000 + i })) 
      });

      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      // Check overdue cards
      cards.forEach((card) => {
        if (card.currentDebt <= 0) return;

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        let dueDate = new Date(currentYear, currentMonth, card.dueDate);
        
        // If this month's due date is in the future, check last month
        if (!isBefore(dueDate, today)) {
          dueDate = new Date(currentYear, currentMonth - 1, card.dueDate);
        }

        const calculation = calculateCardDailyInterest(card.currentDebt, dueDate, false);
        
        if (calculation.isOverdue && calculation.overdueDays > 0) {
          const scheduleTime = setMinutes(
            setHours(new Date(), settings.overdueNotificationTime.hour),
            settings.overdueNotificationTime.minute
          );

          // If scheduled time is past, schedule for next interval
          let notificationDate = scheduleTime;
          if (isBefore(scheduleTime, new Date())) {
            if (settings.overdueNotificationFrequency === 'daily') {
              notificationDate = addDays(scheduleTime, 1);
            } else if (settings.overdueNotificationFrequency === 'every_3_days') {
              notificationDate = addDays(scheduleTime, 3);
            } else {
              notificationDate = addDays(scheduleTime, 7);
            }
          }

          const dailyAmount = calculation.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const totalInterest = calculation.totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const debtFormatted = card.currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          const totalDue = (card.currentDebt + calculation.totalInterest).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

          notifications.notifications.push({
            id: 4000 + notificationIndex,
            title: t('notifications:push.cardOverdue'),
            body: t('notifications:push.cardOverdueBody', { bank: card.bankName, card: card.cardName, days: calculation.overdueDays, daily: dailyAmount, total: totalInterest, debt: debtFormatted, totalDue }),
            schedule: { at: notificationDate },
            sound: 'kredy_urgent.wav',
            actionTypeId: 'overdue-card',
            extra: { cardId: card.id, type: 'credit_card' },
          });
          notificationIndex++;
        }
      });

      // Check overdue loans
      loans.forEach((loan) => {
        if (loan.isPaid || !loan.isOverdue || loan.overdueDays <= 0) return;

        const calculation = calculateLoanDailyInterest(
          loan.monthlyPayment,
          loan.overdueInterestRate,
          loan.overdueDays
        );

        const scheduleTime = setMinutes(
          setHours(new Date(), settings.overdueNotificationTime.hour),
          settings.overdueNotificationTime.minute
        );

        let notificationDate = scheduleTime;
        if (isBefore(scheduleTime, new Date())) {
          if (settings.overdueNotificationFrequency === 'daily') {
            notificationDate = addDays(scheduleTime, 1);
          } else if (settings.overdueNotificationFrequency === 'every_3_days') {
            notificationDate = addDays(scheduleTime, 3);
          } else {
            notificationDate = addDays(scheduleTime, 7);
          }
        }

        const dailyAmount = calculation.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalInterest = loan.totalOverdueInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const paymentFormatted = loan.monthlyPayment.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        notifications.notifications.push({
          id: 4000 + notificationIndex,
          title: t('notifications:push.loanOverdue'),
          body: t('notifications:push.loanOverdueBody', { bank: loan.bankName, name: loan.name, days: loan.overdueDays, daily: dailyAmount, total: totalInterest, payment: paymentFormatted }),
          schedule: { at: notificationDate },
          sound: 'kredy_urgent.wav',
          actionTypeId: 'overdue-loan',
          extra: { loanId: loan.id, type: 'loan' },
        });
        notificationIndex++;
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule overdue notifications:', error);
    }
  }, [cards, loans, settings, permissionGranted]);

  // Schedule loan payment reminders
  const scheduleLoanReminders = useCallback(async () => {
    if (!settings.enabled || !settings.loanPaymentReminder || !permissionGranted) return;

    try {
      // Cancel existing loan reminders (IDs 5000-5100)
      await LocalNotifications.cancel({ 
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 5000 + i })) 
      });

      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };

      loans.forEach((loan, index) => {
        if (loan.isPaid || loan.remainingInstallments <= 0) return;

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Calculate next due date
        let dueDate = new Date(currentYear, currentMonth, loan.dueDay);
        if (isBefore(dueDate, today)) {
          dueDate = addMonths(dueDate, 1);
        }

        const reminderDate = subDays(dueDate, settings.loanReminderDays);
        
        if (differenceInDays(reminderDate, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          const paymentAmount = loan.monthlyPayment.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          notifications.notifications.push({
            id: 5000 + index,
            title: t('notifications:push.loanApproaching'),
            body: t('notifications:push.loanApproachingBody', { bank: loan.bankName, name: loan.name, amount: paymentAmount, days: settings.loanReminderDays, remaining: loan.remainingInstallments }),
            schedule: { at: scheduleTime },
            sound: 'kredy_reminder.wav',
            actionTypeId: 'loan-reminder',
            extra: { loanId: loan.id },
          });
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule loan reminders:', error);
    }
  }, [loans, settings, permissionGranted]);

  // Schedule budget alerts when spending exceeds threshold of category limit
  const scheduleBudgetAlerts = useCallback(async () => {
    if (!settings.enabled || !settings.budgetAlert || !permissionGranted) return;

    try {
      // Cancel existing budget notifications (IDs 6000-6100)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 6000 + i })),
      });

      const budgetsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.BUDGETS);
      const limitsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.CATEGORY_LIMITS);
      if (!budgetsRaw) return;

      const budgets: Budget[] = JSON.parse(budgetsRaw);
      const categoryLimits: CategorySpendingLimit[] = limitsRaw ? JSON.parse(limitsRaw) : [];

      const now = new Date();
      const currentBudget = budgets.find(
        (b) => b.month === now.getMonth() && b.year === now.getFullYear()
      );
      if (!currentBudget) return;

      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      currentBudget.categories.forEach((category) => {
        if (category.allocated <= 0) return;

        // Check category-specific limit threshold or default 80%
        const limitConfig = categoryLimits.find((l) => l.categoryId === category.name as never);
        const threshold = limitConfig ? limitConfig.alertThreshold / 100 : 0.8;

        const usageRatio = category.spent / category.allocated;
        if (usageRatio >= threshold) {
          const tomorrow = addDays(today, 1);
          const scheduleTime = setMinutes(
            setHours(tomorrow, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          const spentFormatted = category.spent.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          const allocatedFormatted = category.allocated.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          const percentage = Math.round(usageRatio * 100);
          const daysLeft = getDaysInMonth(today) - today.getDate();
          const remainingBudget = Math.max(0, category.allocated - category.spent);
          const dailyLeft = daysLeft > 0
            ? (remainingBudget / daysLeft).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            : '0';

          notifications.notifications.push({
            id: 6000 + notificationIndex,
            title: t('notifications:push.budgetAlert'),
            body: t('notifications:push.budgetAlertBody', { category: category.name, spent: spentFormatted, allocated: allocatedFormatted, percentage, daysLeft, dailyLeft }),
            schedule: { at: scheduleTime },
            sound: 'kredy_warning.wav',
            actionTypeId: 'budget-alert',
            extra: { categoryId: category.id, type: 'budget' },
          });
          notificationIndex++;
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule budget alerts:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule goal reminders for deadlines approaching within 7 days
  const scheduleGoalReminders = useCallback(async () => {
    if (!settings.enabled || !settings.goalReminder || !permissionGranted) return;

    try {
      // Cancel existing goal notifications (IDs 7000-7100)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 7000 + i })),
      });

      const goalsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.GOALS);
      if (!goalsRaw) return;

      const goals: Goal[] = JSON.parse(goalsRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      goals.forEach((goal) => {
        if (!goal.deadline) return;
        if (goal.currentAmount >= goal.targetAmount) return;

        const deadlineDate = startOfDay(parseISO(goal.deadline));
        const daysRemaining = differenceInDays(deadlineDate, today);

        // Only alert if deadline is within 7 days and in the future
        if (daysRemaining > 0 && daysRemaining <= 7) {
          const tomorrow = addDays(today, 1);
          const scheduleTime = setMinutes(
            setHours(tomorrow, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          const remaining = (goal.targetAmount - goal.currentAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);

          notifications.notifications.push({
            id: 7000 + notificationIndex,
            title: t('notifications:push.goalDeadline'),
            body: t('notifications:push.goalDeadlineBody', { name: goal.name, days: daysRemaining, remaining, progress }),
            schedule: { at: scheduleTime },
            sound: 'kredy_positive.wav',
            actionTypeId: 'goal-reminder',
            extra: { goalId: goal.id, type: 'goal' },
          });
          notificationIndex++;
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule goal reminders:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule recurring expense reminders for upcoming payment days
  const scheduleRecurringExpenseReminders = useCallback(async () => {
    if (!settings.enabled || !settings.recurringExpenseReminder || !permissionGranted) return;

    try {
      // Cancel existing recurring expense notifications (IDs 8000-8050)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 50 }, (_, i) => ({ id: 8000 + i })),
      });

      const expensesRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.RECURRING_EXPENSES);
      if (!expensesRaw) return;

      const expenses: RecurringExpense[] = JSON.parse(expensesRaw);
      const today = startOfDay(new Date());
      const todayDayOfWeek = today.getDay(); // 0=Sunday
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      expenses.forEach((expense) => {
        if (!expense.isActive) return;

        // Find next active day for this expense
        const sortedDays = [...expense.activeDays].sort((a, b) => a - b);
        let nextActiveDay = sortedDays.find((d) => d > todayDayOfWeek);
        let daysUntilNext = 0;

        if (nextActiveDay !== undefined) {
          daysUntilNext = nextActiveDay - todayDayOfWeek;
        } else if (sortedDays.length > 0) {
          // Wrap to next week
          nextActiveDay = sortedDays[0];
          daysUntilNext = 7 - todayDayOfWeek + nextActiveDay;
        } else {
          return;
        }

        // Schedule reminder 1 day before the next active day (or today if tomorrow is active)
        if (daysUntilNext <= settings.reminderDaysBefore && daysUntilNext > 0) {
          const reminderDate = addDays(today, daysUntilNext > 1 ? daysUntilNext - 1 : 0);
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          // Only schedule if in the future
          if (isBefore(new Date(), scheduleTime)) {
            const amountFormatted = expense.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            notifications.notifications.push({
              id: 8000 + notificationIndex,
              title: t('notifications:push.recurringExpense'),
              body: t('notifications:push.recurringExpenseBody', { name: expense.name, amount: amountFormatted, days: daysUntilNext }),
              schedule: { at: scheduleTime },
              sound: 'kredy_info.wav',
              actionTypeId: 'recurring-expense',
              extra: { expenseId: expense.id, type: 'recurring_expense' },
            });
            notificationIndex++;
          }
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule recurring expense reminders:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule subscription renewal reminders 3 days before billing date
  const scheduleSubscriptionRenewalReminders = useCallback(async () => {
    if (!settings.enabled || !settings.subscriptionRenewalReminder || !permissionGranted) return;

    try {
      // Cancel existing subscription notifications (IDs 8050-8100)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 50 }, (_, i) => ({ id: 8050 + i })),
      });

      const subsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.SUBSCRIPTIONS);
      if (!subsRaw) return;

      const subscriptions: Subscription[] = JSON.parse(subsRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      const cycleMap: Record<string, string> = { weekly: 'haftalık', monthly: 'aylık', yearly: 'yıllık' };

      subscriptions.forEach((sub) => {
        if (!sub.isActive) return;

        const cycle = cycleMap[sub.billingCycle] || sub.billingCycle;

        // Calculate next billing date
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = Math.min(sub.billingDate, new Date(year, month + 1, 0).getDate());

        const nextBillingDate = new Date(year, month, day);
        if (nextBillingDate <= now) {
          if (sub.billingCycle === 'weekly') {
            nextBillingDate.setDate(nextBillingDate.getDate() + 7);
          } else if (sub.billingCycle === 'monthly') {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          } else {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          }
        }

        const reminderDate = subDays(startOfDay(nextBillingDate), 3);
        const daysUntilBilling = differenceInDays(startOfDay(nextBillingDate), today);

        // Schedule if reminder date is in the future (billing within ~3 days)
        if (daysUntilBilling > 0 && daysUntilBilling <= 3) {
          // Billing is within 3 days, schedule for today or tomorrow
          const scheduleDate = isBefore(today, reminderDate) ? reminderDate : addDays(today, 1);
          const scheduleTime = setMinutes(
            setHours(scheduleDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          if (isBefore(new Date(), scheduleTime)) {
            const amountFormatted = sub.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            notifications.notifications.push({
              id: 8050 + notificationIndex,
              title: t('notifications:push.subscriptionRenewal'),
              body: t('notifications:push.subscriptionRenewalBody', { name: sub.name, amount: amountFormatted, days: daysUntilBilling, cycle }),
              schedule: { at: scheduleTime },
              sound: 'kredy_reminder.wav',
              actionTypeId: 'subscription-renewal',
              extra: { subscriptionId: sub.id, type: 'subscription' },
            });
            notificationIndex++;
          }
        } else if (differenceInDays(reminderDate, today) > 0) {
          // Reminder date is still in the future (more than 3 days to billing)
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          const amountFormatted = sub.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          notifications.notifications.push({
            id: 8050 + notificationIndex,
            title: t('notifications:push.subscriptionRenewal'),
            body: t('notifications:push.subscriptionRenewalBody', { name: sub.name, amount: amountFormatted, days: daysUntilBilling, cycle }),
            schedule: { at: scheduleTime },
            sound: 'kredy_reminder.wav',
            actionTypeId: 'subscription-renewal',
            extra: { subscriptionId: sub.id, type: 'subscription' },
          });
          notificationIndex++;
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule subscription renewal reminders:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule statement reminders (1 day before statement date)
  const scheduleStatementReminders = useCallback(async () => {
    if (!settings.enabled || !settings.statementReminder || !permissionGranted) return;

    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9100 + i })),
      });

      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };

      cards.forEach((card, index) => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let statementDate = new Date(currentYear, currentMonth, card.statementDate);
        if (isBefore(statementDate, today)) {
          statementDate = new Date(currentYear, currentMonth + 1, card.statementDate);
        }

        // Remind 1 day before statement date
        const reminderDate = subDays(statementDate, 1);

        if (differenceInDays(reminderDate, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          const debtAmount = card.currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

          notifications.notifications.push({
            id: 9100 + index,
            title: t('notifications:push.statementReminder'),
            body: t('notifications:push.statementReminderBody', { bank: card.bankName, card: card.cardName, amount: debtAmount }),
            schedule: { at: scheduleTime },
            sound: 'kredy_info.wav',
            actionTypeId: 'statement-reminder',
            extra: { cardId: card.id },
          });
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule statement reminders:', error);
    }
  }, [cards, settings, permissionGranted]);

  // Schedule vehicle inspection reminders (30/14/7/1 days before)
  const scheduleVehicleInspectionReminders = useCallback(async () => {
    if (!settings.enabled || !settings.vehicleInspectionReminder || !permissionGranted) return;

    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9200 + i })),
      });

      const vehiclesRaw = localStorage.getItem('kredi-pusula-vehicles');
      if (!vehiclesRaw) return;

      const vehicles: Vehicle[] = JSON.parse(vehiclesRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      vehicles.forEach((vehicle) => {
        if (!vehicle.lastInspectionDate) return;

        // Next inspection is ~2 years after last inspection
        const lastInspection = new Date(vehicle.lastInspectionDate);
        const nextInspection = addMonths(startOfDay(lastInspection), 24);

        const reminderDays = [30, 14, 7, 1];
        reminderDays.forEach((daysBefore) => {
          const reminderDate = subDays(nextInspection, daysBefore);
          const daysUntil = differenceInDays(reminderDate, today);

          if (daysUntil > 0 && daysUntil <= daysBefore + 1) {
            const scheduleTime = setMinutes(
              setHours(reminderDate, settings.reminderTime.hour),
              settings.reminderTime.minute
            );

            notifications.notifications.push({
              id: 9200 + notificationIndex,
              title: t('notifications:push.vehicleInspection'),
              body: t('notifications:push.vehicleInspectionBody', { name: vehicle.name, plate: vehicle.plate, days: daysBefore }),
              schedule: { at: scheduleTime },
              sound: 'kredy_warning.wav',
              actionTypeId: 'vehicle-inspection',
              extra: { vehicleName: vehicle.name },
            });
            notificationIndex++;
          }
        });
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule vehicle inspection reminders:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule rent due reminders (3 days before rental day of month)
  const scheduleRentDueReminders = useCallback(async () => {
    if (!settings.enabled || !settings.rentDueReminder || !permissionGranted) return;

    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9300 + i })),
      });

      const propertiesRaw = localStorage.getItem('kredi-pusula-properties');
      if (!propertiesRaw) return;

      const properties: Property[] = JSON.parse(propertiesRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      properties.forEach((property) => {
        if (!property.isRented || !property.rentalDayOfMonth) return;

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let rentDate = new Date(currentYear, currentMonth, property.rentalDayOfMonth);
        if (isBefore(rentDate, today)) {
          rentDate = addMonths(rentDate, 1);
        }

        const reminderDate = subDays(rentDate, 3);

        if (differenceInDays(reminderDate, today) >= 0) {
          const scheduleDate = differenceInDays(reminderDate, today) === 0
            ? addDays(today, 1)
            : reminderDate;
          const scheduleTime = setMinutes(
            setHours(scheduleDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          if (isBefore(new Date(), scheduleTime)) {
            const amountFormatted = property.monthlyRentAmount
              ? property.monthlyRentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
              : '?';

            notifications.notifications.push({
              id: 9300 + notificationIndex,
              title: t('notifications:push.rentDue'),
              body: t('notifications:push.rentDueBody', { name: property.name, days: 3, amount: amountFormatted }),
              schedule: { at: scheduleTime },
              sound: 'kredy_reminder.wav',
              actionTypeId: 'rent-due',
              extra: { propertyName: property.name },
            });
            notificationIndex++;
          }
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule rent due reminders:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule contract renewal reminders (30/14/7 days before)
  const scheduleContractRenewalReminders = useCallback(async () => {
    if (!settings.enabled || !settings.contractRenewalReminder || !permissionGranted) return;

    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9400 + i })),
      });

      const propertiesRaw = localStorage.getItem('kredi-pusula-properties');
      if (!propertiesRaw) return;

      const properties: Property[] = JSON.parse(propertiesRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      properties.forEach((property) => {
        if (!property.isRented || !property.contractEndDate) return;

        const contractEnd = startOfDay(parseISO(property.contractEndDate));
        const daysUntilEnd = differenceInDays(contractEnd, today);

        if (daysUntilEnd <= 0) return; // Already expired

        const reminderDays = [30, 14, 7];
        reminderDays.forEach((daysBefore) => {
          if (daysUntilEnd <= daysBefore && daysUntilEnd > 0) {
            const reminderDate = subDays(contractEnd, daysBefore);
            const scheduleDate = differenceInDays(reminderDate, today) <= 0
              ? addDays(today, 1)
              : reminderDate;
            const scheduleTime = setMinutes(
              setHours(scheduleDate, settings.reminderTime.hour),
              settings.reminderTime.minute
            );

            if (isBefore(new Date(), scheduleTime)) {
              const contractDateFormatted = format(contractEnd, 'd MMMM yyyy', { locale: tr });

              notifications.notifications.push({
                id: 9400 + notificationIndex,
                title: t('notifications:push.contractRenewal'),
                body: t('notifications:push.contractRenewalBody', { name: property.name, days: daysUntilEnd, date: contractDateFormatted }),
                schedule: { at: scheduleTime },
                sound: 'kredy_info.wav',
                actionTypeId: 'contract-renewal',
                extra: { propertyName: property.name },
              });
              notificationIndex++;
            }
          }
        });
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule contract renewal reminders:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule recurring bill reminders (2 days before payment day)
  const scheduleRecurringBillReminders = useCallback(async () => {
    if (!settings.enabled || !settings.recurringBillReminder || !permissionGranted) return;

    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9500 + i })),
      });

      const billsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.MONTHLY_BILLS);
      if (!billsRaw) return;

      const bills: RecurringBill[] = JSON.parse(billsRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      bills.forEach((bill) => {
        if (!bill.isActive || bill.frequency !== 'monthly' || !bill.dayOfMonth) return;

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let billDate = new Date(currentYear, currentMonth, bill.dayOfMonth);
        if (isBefore(billDate, today)) {
          billDate = addMonths(billDate, 1);
        }

        const reminderDate = subDays(billDate, 2);

        if (differenceInDays(reminderDate, today) >= 0) {
          const scheduleDate = differenceInDays(reminderDate, today) === 0
            ? addDays(today, 1)
            : reminderDate;
          const scheduleTime = setMinutes(
            setHours(scheduleDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );

          if (isBefore(new Date(), scheduleTime)) {
            const amountFormatted = (bill.fixedAmount || bill.lastPaidAmount || 0)
              .toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

            notifications.notifications.push({
              id: 9500 + notificationIndex,
              title: t('notifications:push.recurringBill'),
              body: t('notifications:push.recurringBillBody', { name: bill.name, days: 2, amount: amountFormatted }),
              schedule: { at: scheduleTime },
              sound: 'kredy_reminder.wav',
              actionTypeId: 'recurring-bill',
              extra: { billId: bill.id },
            });
            notificationIndex++;
          }
        }
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule recurring bill reminders:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule daily investment portfolio summary
  const scheduleInvestmentPriceAlerts = useCallback(async () => {
    if (!settings.enabled || !settings.investmentPriceAlert || !permissionGranted) return;

    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 10 }, (_, i) => ({ id: 9600 + i })),
      });

      const investmentsRaw = localStorage.getItem('kredi-pusula-investments');
      if (!investmentsRaw) return;

      const investments: Investment[] = JSON.parse(investmentsRaw);
      if (investments.length === 0) return;

      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      const scheduleTime = setMinutes(
        setHours(tomorrow, settings.reminderTime.hour),
        settings.reminderTime.minute
      );

      const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
      const totalFormatted = totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      const uniqueCategories = new Set(investments.map(inv => inv.category)).size;

      await LocalNotifications.schedule({
        notifications: [{
          id: 9600,
          title: t('notifications:push.investmentSummary'),
          body: t('notifications:push.investmentSummaryBody', { count: investments.length, total: totalFormatted, types: uniqueCategories }),
          schedule: { at: scheduleTime },
          sound: 'kredy_positive.wav',
          actionTypeId: 'investment-alert',
          extra: { type: 'investment_summary' },
        }],
      });
    } catch (error) {
      console.error('Failed to schedule investment price alerts:', error);
    }
  }, [settings, permissionGranted]);

  // Schedule KMH interest reminders for accounts with negative balance
  const scheduleKMHInterestReminders = useCallback(async () => {
    if (!settings.enabled || !settings.kmhInterestReminder || !permissionGranted) return;

    try {
      // Cancel existing KMH notifications (IDs 9700-9749)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 50 }, (_, i) => ({ id: 9700 + i })),
      });

      // Check both personal and family accounts
      const keys = [PERSONAL_STORAGE_KEYS.ACCOUNTS, FAMILY_STORAGE_KEYS.ACCOUNTS];
      const allAccounts: Account[] = [];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw) allAccounts.push(...JSON.parse(raw));
      }

      const kmhAccounts = allAccounts.filter(
        (a) => a.kmhEnabled && a.balance < 0
      );

      if (kmhAccounts.length === 0) return;

      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;

      kmhAccounts.forEach((account) => {
        const negativeBalance = Math.abs(account.balance);
        const rate = account.kmhInterestRate || KMH_CONSTANTS.DEFAULT_INTEREST_RATE;
        const dailyInterest = negativeBalance * (rate / 100 / 30) * KMH_CONSTANTS.TAX_MULTIPLIER;
        const kmhLimit = account.kmhLimit || 0;
        const usagePercent = kmhLimit > 0 ? (negativeBalance / kmhLimit) * 100 : 0;

        const scheduleTime = setMinutes(
          setHours(tomorrow, settings.reminderTime.hour),
          settings.reminderTime.minute
        );

        const dailyFormatted = dailyInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const balanceFormatted = negativeBalance.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        // Critical alert if usage > 75%
        if (usagePercent >= KMH_CONSTANTS.SEVERITY_HIGH * 100) {
          notifications.notifications.push({
            id: 9700 + notificationIndex,
            title: t('notifications:push.kmhCritical', { defaultValue: 'KMH Kritik Uyar\u0131!' }),
            body: t('notifications:push.kmhCriticalBody', {
              defaultValue: '{{name}} hesab\u0131n\u0131z\u0131n KMH kullan\u0131m\u0131 %{{percent}} seviyesinde. Eksi bakiye: \u20ba{{balance}}, g\u00fcnl\u00fck faiz: \u20ba{{daily}}',
              name: account.name,
              percent: Math.round(usagePercent),
              balance: balanceFormatted,
              daily: dailyFormatted,
            }),
            schedule: { at: scheduleTime },
            sound: 'kredy_urgent.wav',
            actionTypeId: 'kmh-critical',
            extra: { accountId: account.id, type: 'kmh' },
          });
        } else {
          notifications.notifications.push({
            id: 9700 + notificationIndex,
            title: t('notifications:push.kmhInterestReminder', { defaultValue: 'KMH Faiz Hat\u0131rlatmas\u0131' }),
            body: t('notifications:push.kmhInterestReminderBody', {
              defaultValue: '{{name}} hesab\u0131n\u0131z eksi bakiyede. G\u00fcnl\u00fck faiz: \u20ba{{daily}}, toplam eksi: \u20ba{{balance}}',
              name: account.name,
              daily: dailyFormatted,
              balance: balanceFormatted,
            }),
            schedule: { at: scheduleTime },
            sound: 'kredy_warning.wav',
            actionTypeId: 'kmh-reminder',
            extra: { accountId: account.id, type: 'kmh' },
          });
        }
        notificationIndex++;
      });

      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule KMH interest reminders:', error);
    }
  }, [settings, permissionGranted]);

  // Generate daily overdue summary message
  const generateOverdueSummary = useCallback((): { messages: string[]; totalDailyInterest: number } => {
    const messages: string[] = [];
    let totalDailyInterest = 0;
    const today = startOfDay(new Date());

    // Check cards
    cards.forEach((card) => {
      if (card.currentDebt <= 0) return;

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      let dueDate = new Date(currentYear, currentMonth, card.dueDate);
      
      if (!isBefore(dueDate, today)) {
        dueDate = new Date(currentYear, currentMonth - 1, card.dueDate);
      }

      const calculation = calculateCardDailyInterest(card.currentDebt, dueDate, false);
      
      if (calculation.isOverdue) {
        const dailyAmount = calculation.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalInterest = calculation.totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        messages.push(
          t('notifications:push.summaryCardOverdue', { bank: card.bankName, card: card.cardName, days: calculation.overdueDays, daily: dailyAmount, total: totalInterest })
        );
        totalDailyInterest += calculation.dailyAmount;
      }
    });

    // Check loans
    loans.forEach((loan) => {
      if (loan.isPaid || !loan.isOverdue || loan.overdueDays <= 0) return;

      const calculation = calculateLoanDailyInterest(
        loan.monthlyPayment,
        loan.overdueInterestRate,
        loan.overdueDays
      );

      const dailyAmount = calculation.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const totalInterest = loan.totalOverdueInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      messages.push(
        t('notifications:push.summaryLoanOverdue', { bank: loan.bankName, name: loan.name, days: loan.overdueDays, daily: dailyAmount, total: totalInterest })
      );
      totalDailyInterest += calculation.dailyAmount;
    });

    // Add summary if multiple items
    if (messages.length > 1) {
      const totalFormatted = totalDailyInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      messages.push(t('notifications:push.summaryTotal', { count: messages.length, amount: totalFormatted }));
    }

    return { messages, totalDailyInterest };
  }, [cards, loans]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('kredi-pusula-notification-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Send immediate test notification (includes first card's ID for payment action testing)
  const sendTestNotification = useCallback(async () => {
    try {
      const firstCard = cards.length > 0 ? cards[0] : null;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: firstCard
              ? t('notifications:push.paymentApproaching')
              : t('notifications:push.testTitle'),
            body: firstCard
              ? t('notifications:push.paymentApproachingBody', {
                  bank: firstCard.bankName,
                  card: firstCard.cardName,
                  days: 3,
                  amount: firstCard.currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                  date: 'test',
                })
              : t('notifications:push.testBody'),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'kredy_info.wav',
            actionTypeId: firstCard ? 'payment-reminder' : 'test-notification',
            extra: firstCard ? { cardId: firstCard.id } : undefined,
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }, [cards]);

  // Send immediate overdue notification (for testing)
  const sendOverdueTestNotification = useCallback(async () => {
    const { messages, totalDailyInterest } = generateOverdueSummary();
    
    if (messages.length === 0) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 9998,
              title: t('notifications:push.noOverdue'),
              body: t('notifications:push.noOverdueBody'),
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'kredy_info.wav',
            },
          ],
        });
        return true;
      } catch (error) {
        console.error('Test notification failed:', error);
        return false;
      }
    }

    try {
      const totalFormatted = totalDailyInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9998,
            title: t('notifications:push.overdueTitle'),
            body: t('notifications:push.overdueBody', { count: messages.length, amount: totalFormatted }),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'kredy_urgent.wav',
            actionTypeId: 'overdue-reminder',
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }, [generateOverdueSummary]);

  // Initialize permissions on mount
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Reschedule notifications when cards, loans or settings change
  useEffect(() => {
    if (permissionGranted) {
      schedulePaymentReminders();
      scheduleGoldenWindowAlerts();
      scheduleTaxReminders();
      scheduleOverdueNotifications();
      scheduleLoanReminders();
      scheduleBudgetAlerts();
      scheduleGoalReminders();
      scheduleRecurringExpenseReminders();
      scheduleSubscriptionRenewalReminders();
      scheduleStatementReminders();
      scheduleVehicleInspectionReminders();
      scheduleRentDueReminders();
      scheduleContractRenewalReminders();
      scheduleRecurringBillReminders();
      scheduleInvestmentPriceAlerts();
      scheduleKMHInterestReminders();
    }
  }, [permissionGranted, schedulePaymentReminders, scheduleGoldenWindowAlerts, scheduleTaxReminders, scheduleOverdueNotifications, scheduleLoanReminders, scheduleBudgetAlerts, scheduleGoalReminders, scheduleRecurringExpenseReminders, scheduleSubscriptionRenewalReminders, scheduleStatementReminders, scheduleVehicleInspectionReminders, scheduleRentDueReminders, scheduleContractRenewalReminders, scheduleRecurringBillReminders, scheduleInvestmentPriceAlerts, scheduleKMHInterestReminders]);

  // Re-schedule all notifications when app returns to foreground
  const permissionRef = useRef(permissionGranted);
  permissionRef.current = permissionGranted;

  const rescheduleAll = useCallback(() => {
    schedulePaymentReminders();
    scheduleGoldenWindowAlerts();
    scheduleTaxReminders();
    scheduleOverdueNotifications();
    scheduleLoanReminders();
    scheduleBudgetAlerts();
    scheduleGoalReminders();
    scheduleRecurringExpenseReminders();
    scheduleSubscriptionRenewalReminders();
    scheduleStatementReminders();
    scheduleVehicleInspectionReminders();
    scheduleRentDueReminders();
    scheduleContractRenewalReminders();
    scheduleRecurringBillReminders();
    scheduleInvestmentPriceAlerts();
    scheduleKMHInterestReminders();
  }, [schedulePaymentReminders, scheduleGoldenWindowAlerts, scheduleTaxReminders, scheduleOverdueNotifications, scheduleLoanReminders, scheduleBudgetAlerts, scheduleGoalReminders, scheduleRecurringExpenseReminders, scheduleSubscriptionRenewalReminders, scheduleStatementReminders, scheduleVehicleInspectionReminders, scheduleRentDueReminders, scheduleContractRenewalReminders, scheduleRecurringBillReminders, scheduleInvestmentPriceAlerts, scheduleKMHInterestReminders]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => void } | null = null;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const l = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive && permissionRef.current) {
            rescheduleAll();
          }
        });
        listener = l;
      } catch { /* web — no Capacitor */ }
    })();

    return () => { listener?.remove(); };
  }, [rescheduleAll]);

  return {
    settings,
    updateSettings,
    permissionGranted,
    requestPermissions,
    sendTestNotification,
    sendOverdueTestNotification,
    generateOverdueSummary,
    // Yeni export'lar
    calculateNextKDVDate,
    calculateNextQuarterlyTaxDate,
    scheduleOverdueNotifications,
    scheduleLoanReminders,
    scheduleBudgetAlerts,
    scheduleGoalReminders,
    scheduleRecurringExpenseReminders,
    scheduleSubscriptionRenewalReminders,
    scheduleStatementReminders,
    scheduleVehicleInspectionReminders,
    scheduleRentDueReminders,
    scheduleContractRenewalReminders,
    scheduleRecurringBillReminders,
    scheduleInvestmentPriceAlerts,
    scheduleKMHInterestReminders,
  };
}
