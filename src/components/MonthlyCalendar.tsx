import { useState, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { tr } from "date-fns/locale";
import { CreditCard } from "@/types/finance";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar, CreditCard as CardIcon, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthlyCalendarProps {
  cards: CreditCard[];
}

interface CalendarEvent {
  date: Date;
  card: CreditCard;
  type: "payment" | "statement" | "goldenWindow";
}

export function MonthlyCalendar({ cards }: MonthlyCalendarProps) {
  const { t } = useTranslation(['cards', 'common']);
  const WEEKDAYS = [
    t('cards:calendar.weekdays.mon'), t('cards:calendar.weekdays.tue'),
    t('cards:calendar.weekdays.wed'), t('cards:calendar.weekdays.thu'),
    t('cards:calendar.weekdays.fri'), t('cards:calendar.weekdays.sat'),
    t('cards:calendar.weekdays.sun'),
  ];
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    [-1, 0, 1].forEach((monthOffset) => {
      const targetMonth = addMonths(currentMonth, monthOffset);
      const month = targetMonth.getMonth();
      const year = targetMonth.getFullYear();

      cards.forEach((card) => {
        const statementDate = new Date(year, month, card.statementDate);
        allEvents.push({ date: statementDate, card, type: "statement" });

        const dueDate = new Date(year, month, card.dueDate);
        allEvents.push({ date: dueDate, card, type: "payment" });

        // Golden window: 5 days after statement date (day 1-5)
        for (let d = 1; d <= 5; d++) {
          const goldenWindowDate = addDays(statementDate, d);
          allEvents.push({ date: goldenWindowDate, card, type: "goldenWindow" });
        }
      });
    });

    return allEvents;
  }, [cards, currentMonth]);

  const getEventsForDay = (day: Date) =>
    events.filter((event) => isSameDay(event.date, day));

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getEventStyle = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "payment":
        return {
          indicator: (
            <div className="h-0 w-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-red-500" />
          ),
          icon: <CardIcon className="h-3 w-3" />,
          label: t('cards:calendar.dueDate'),
        };
      case "goldenWindow":
        return {
          indicator: <span className="text-xs leading-none text-amber-500">★</span>,
          icon: <Sparkles className="h-3 w-3" />,
          label: t('cards:calendar.goldenWindow'),
        };
      case "statement":
        return {
          indicator: <div className="h-2 w-3.5 bg-sky-400" />,
          icon: <FileText className="h-3 w-3" />,
          label: t('cards:calendar.statementDate'),
        };
    }
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

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
        <Button variant="outline" size="sm" onClick={goToToday}>
          {t('cards:calendar.today')}
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => navigateMonth("prev")}
          className="rounded-lg p-2 transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: tr })}
        </h3>
        <button
          onClick={() => navigateMonth("next")}
          className="rounded-lg p-2 transition-colors hover:bg-secondary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          const hasPayment = dayEvents.some((e) => e.type === "payment");
          const hasGoldenWindow = dayEvents.some((e) => e.type === "goldenWindow");
          const hasStatement = dayEvents.some((e) => e.type === "statement");

          return (
            <button
              key={index}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "relative flex min-h-[60px] flex-col items-center rounded-lg p-1 transition-all",
                !isCurrentMonth && "opacity-40",
                isSelected && "ring-2 ring-primary",
                isTodayDate && "bg-primary text-primary-foreground",
                !isTodayDate && isCurrentMonth && "hover:bg-secondary",
                !isTodayDate && !isCurrentMonth && "hover:bg-secondary/50"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  isTodayDate && "text-primary-foreground",
                  !isCurrentMonth && "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Event Type Indicators */}
              {dayEvents.length > 0 && (
                <div className="mt-1 flex flex-wrap justify-center gap-1 items-center">
                  {hasPayment && (
                    <div
                      className="h-0 w-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-500"
                      title={t('cards:calendar.dueDate')}
                    />
                  )}
                  {hasGoldenWindow && (
                    <span className="text-[8px] leading-none text-amber-500" title={t('cards:calendar.goldenWindow')}>
                      ★
                    </span>
                  )}
                  {hasStatement && (
                    <div
                      className="h-1.5 w-2.5 bg-sky-400"
                      title={t('cards:calendar.statementDate')}
                    />
                  )}
                </div>
              )}

              {/* Bank circles */}
              {dayEvents.length > 0 && (
                <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                  {Array.from(new Set(dayEvents.map(e => e.card.id))).slice(0, 3).map((cardId) => {
                    const event = dayEvents.find(e => e.card.id === cardId);
                    if (!event) return null;
                    return (
                      <div
                        key={cardId}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full bg-gradient-to-br",
                          event.card.color
                        )}
                        title={event.card.bankName}
                      />
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-3">
        {/* Event Type Legend */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-0 w-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-500" />
            <span className="text-xs text-muted-foreground">{t('cards:calendar.dueDate')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none text-amber-500">★</span>
            <span className="text-xs text-muted-foreground">{t('cards:calendar.goldenWindow')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-4 bg-sky-400" />
            <span className="text-xs text-muted-foreground">{t('cards:calendar.statementDate')}</span>
          </div>
        </div>

        {/* Bank Color Legend - circles */}
        <div className="flex flex-wrap justify-center gap-3">
          {cards.map((card) => (
            <div key={card.id} className="flex items-center gap-1.5">
              <div className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-br", card.color)} />
              <span className="text-[10px] text-muted-foreground">{card.bankName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && selectedDayEvents.length > 0 && (
        <div className="mt-5 rounded-xl bg-secondary/50 p-4">
          <h4 className="text-sm font-semibold">
            {format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })}
          </h4>
          <div className="mt-3 space-y-2">
            {selectedDayEvents.map((event, index) => {
              const style = getEventStyle(event.type);
              return (
                <div key={`${event.card.id}-${event.type}-${index}`} className="space-y-1.5">
                  <div className="flex items-center gap-3 rounded-lg bg-background/50 p-3">
                    {/* Bank icon - circular */}
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br",
                      event.card.color
                    )}>
                      <div className="text-white">{style.icon}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {event.card.bankName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.card.cardName} •••• {event.card.lastFourDigits}
                      </p>
                    </div>
                    {/* Event type badge with indicator */}
                    <div className="flex items-center gap-1.5">
                      {style.indicator}
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {style.label}
                      </span>
                    </div>
                  </div>
                  {/* Event explanation cards */}
                  {event.type === "goldenWindow" && (
                    <div className="ml-[52px] rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 border border-amber-200/50 dark:border-amber-800/30">
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        <span className="font-semibold">{t('cards:calendar.statementLabel')}</span> {t('cards:calendar.everyMonth', { day: event.card.statementDate })}
                        {" • "}
                        <span className="font-semibold">{t('cards:calendar.dueDateLabel')}</span> {t('cards:calendar.everyMonth', { day: event.card.dueDate })}
                      </p>
                      <p className="mt-0.5 text-[10px] text-amber-700/80 dark:text-amber-400/70">
                        {t('cards:calendar.goldenWindowExplanation')}
                      </p>
                    </div>
                  )}
                  {event.type === "statement" && (
                    <div className="ml-[52px] rounded-lg bg-sky-50 dark:bg-sky-950/30 px-3 py-2 border border-sky-200/50 dark:border-sky-800/30">
                      <p className="text-[11px] text-sky-800 dark:text-sky-300">
                        <span className="font-semibold">{t('cards:calendar.statementLabel')}</span> {t('cards:calendar.everyMonth', { day: event.card.statementDate })}
                        {" • "}
                        <span className="font-semibold">{t('cards:calendar.dueDateLabel')}</span> {t('cards:calendar.everyMonth', { day: event.card.dueDate })}
                      </p>
                      <p className="mt-0.5 text-[10px] text-sky-700/80 dark:text-sky-400/70">
                        {t('cards:calendar.statementExplanation')}
                      </p>
                    </div>
                  )}
                  {event.type === "payment" && (
                    <div className="ml-[52px] rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 border border-red-200/50 dark:border-red-800/30">
                      <p className="text-[11px] text-red-800 dark:text-red-300">
                        <span className="font-semibold">{t('cards:calendar.dueDateLabel')}</span> {t('cards:calendar.everyMonth', { day: event.card.dueDate })}
                      </p>
                      <p className="mt-0.5 text-[10px] text-red-700/80 dark:text-red-400/70">
                        {t('cards:calendar.paymentExplanation')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedDate && selectedDayEvents.length === 0 && (
        <div className="mt-5 rounded-xl bg-secondary/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t('cards:calendar.noEvents', { date: format(selectedDate, "d MMMM", { locale: tr }) })}
          </p>
        </div>
      )}
    </div>
  );
}
