import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { tr, enUS, ar, ru } from "date-fns/locale";
import { CreditCard, Payment } from "@/types/finance";
import { formatCurrency } from "@/lib/financeUtils";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from "lucide-react";

const DATE_LOCALES: Record<string, Locale> = { tr, en: enUS, ar, ru };

interface PaymentCalendarProps {
  cards: CreditCard[];
  payments?: Payment[];
}

interface CalendarEvent {
  date: Date;
  card: CreditCard;
  type: "payment" | "statement" | "goldenWindow";
  amount?: number;
}

export function PaymentCalendar({ cards, payments = [] }: PaymentCalendarProps) {
  const { t, i18n } = useTranslation(['cards']);
  const dateLocale = DATE_LOCALES[i18n.language] || tr;
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  // Generate events from cards and payments
  const events: CalendarEvent[] = [];

  cards.forEach((card) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Statement date
    const statementDate = new Date(currentYear, currentMonth, card.statementDate);
    events.push({
      date: statementDate,
      card,
      type: "statement",
    });

    // Due date
    const dueDate = new Date(currentYear, currentMonth, card.dueDate);
    events.push({
      date: dueDate,
      card,
      type: "payment",
      amount: card.minimumPayment,
    });

    // Golden window (day after statement)
    const goldenWindowDate = addDays(statementDate, 1);
    events.push({
      date: goldenWindowDate,
      card,
      type: "goldenWindow",
    });
  });

  const getEventsForDay = (day: Date) =>
    events.filter((event) => isSameDay(event.date, day));

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      addDays(prev, direction === "next" ? 7 : -7)
    );
  };

  const isToday = (day: Date) => isSameDay(day, new Date());

  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-card-foreground">
            {t('cards:calendar.title')}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateWeek("prev")}
            className="rounded-lg p-2 transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-medium text-muted-foreground">
            {format(currentWeekStart, "d MMM", { locale: dateLocale })} -{" "}
            {format(addDays(currentWeekStart, 6), "d MMM yyyy", { locale: dateLocale })}
          </span>
          <button
            onClick={() => navigateWeek("next")}
            className="rounded-lg p-2 transition-colors hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={index}
              className={cn(
                "flex min-w-[100px] flex-1 flex-col items-center rounded-xl p-3 transition-all",
                isToday(day)
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-secondary/50 hover:bg-secondary"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium uppercase",
                  isToday(day) ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {format(day, "EEE", { locale: dateLocale })}
              </span>
              <span
                className={cn(
                  "mt-1 text-lg font-bold",
                  isToday(day) ? "text-primary-foreground" : "text-card-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Event Indicators with Card Names */}
              <div className="mt-2 flex flex-col gap-1">
                {dayEvents.map((event, eventIndex) => {
                  const bgColor = 
                    event.type === "payment" 
                      ? (isToday(day) ? "bg-red-300" : "bg-danger")
                      : event.type === "goldenWindow" 
                        ? (isToday(day) ? "bg-yellow-300" : "bg-yellow-500")
                        : (isToday(day) ? "bg-blue-300" : "bg-info");
                  
                  const label = 
                    event.type === "payment" ? "💳" 
                    : event.type === "goldenWindow" ? "🌟" 
                    : "📋";
                  
                  return (
                    <div
                      key={`${event.card.id}-${event.type}-${eventIndex}`}
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium",
                        bgColor,
                        isToday(day) ? "text-foreground" : "text-white"
                      )}
                      title={`${event.card.bankName} ${event.card.cardName} - ${
                        event.type === "payment" ? t('cards:calendar.dueDate')
                        : event.type === "goldenWindow" ? t('cards:calendar.goldenWindow')
                        : t('cards:calendar.statementDate')
                      }`}
                    >
                      <span>{label}</span>
                      <span className="truncate max-w-[50px]">{event.card.bankName.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-danger" />
          <span className="text-xs text-muted-foreground">{t('cards:calendar.payment')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">{t('cards:calendar.goldenWindow')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-info" />
          <span className="text-xs text-muted-foreground">{t('cards:calendar.statementDate')}</span>
        </div>
      </div>

      {/* Upcoming Payments */}
      <div className="mt-5 space-y-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          {t('cards:calendar.upcomingPayments')}
        </h3>
        {payments
          .filter((p) => p.status === "pending")
          .slice(0, 3)
          .map((payment) => {
            const card = cards.find((c) => c.id === payment.cardId);
            if (!card) return null;

            const daysUntil = Math.ceil(
              (payment.dueDate.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl bg-secondary/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br",
                      card.color
                    )}
                  >
                    <span className="text-xs font-bold text-white">
                      {card.bankName.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {card.cardName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(payment.dueDate, "d MMMM", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-card-foreground">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      daysUntil <= 3 ? "text-danger" : "text-muted-foreground"
                    )}
                  >
                    {daysUntil <= 0 ? t('cards:calendar.todayExcl') : t('cards:calendar.daysRemaining', { days: daysUntil })}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
