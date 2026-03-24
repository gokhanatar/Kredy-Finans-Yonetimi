import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoldenWindowCard } from "@/types/finance";
import { formatCurrency } from "@/lib/financeUtils";
import { Sparkles, ShoppingBag, ArrowRight, Info, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/hooks/usePrivacyMode";

interface TodaysCardWidgetProps {
  goldenCard: GoldenWindowCard | null;
  onShopClick?: () => void;
}

export function TodaysCardWidget({
  goldenCard,
  onShopClick,
}: TodaysCardWidgetProps) {
  const { t } = useTranslation(['cards']);
  const { isPrivate } = usePrivacyMode();
  const [showExplanation, setShowExplanation] = useState(false);

  if (!goldenCard) {
    return (
      <div className="rounded-2xl bg-secondary/50 p-5 text-center">
        <p className="text-muted-foreground">{t('cards:todaysCard.noCard')}</p>
      </div>
    );
  }
  const { card, isGoldenWindow, daysUntilPayment, goldenRating, goldenDaysRemaining, recommendation } = goldenCard;

  // Calculate golden window dates for explanation
  const statementDay = card.statementDate;
  const dueDay = card.dueDate;
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Next statement date
  const nextStatement = new Date(currentYear, currentMonth, statementDay);
  if (nextStatement <= today) {
    nextStatement.setMonth(nextStatement.getMonth() + 1);
  }
  // Next due date after statement
  const nextDue = new Date(nextStatement.getFullYear(), nextStatement.getMonth(), dueDay);
  if (nextDue <= nextStatement) {
    nextDue.setMonth(nextDue.getMonth() + 1);
  }
  // Total grace days
  const graceDays = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const formatShortDate = (d: Date) =>
    d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        isGoldenWindow
          ? "gradient-gold text-yellow-900"
          : "bg-gradient-to-br from-slate-800 to-slate-900 text-white"
      )}
    >
      {/* Background Decoration */}
      {isGoldenWindow && (
        <>
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-300/30 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-orange-300/30 blur-2xl" />
        </>
      )}

      {/* Header */}
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              className={cn(
                "h-5 w-5",
                isGoldenWindow ? "text-yellow-700" : "text-yellow-400"
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold uppercase tracking-wide",
                isGoldenWindow ? "text-yellow-800" : "text-yellow-400"
              )}
            >
              {t('cards:todaysCard.title')}
            </span>
          </div>
          <h2
            className={cn(
              "mt-2 text-2xl font-bold",
              isGoldenWindow ? "text-yellow-900" : "text-white"
            )}
          >
            {card.cardName}
          </h2>
          <p
            className={cn(
              "text-sm",
              isGoldenWindow ? "text-yellow-800/80" : "text-white/70"
            )}
          >
            {card.bankName}
          </p>

          {/* Star Rating & Days Remaining */}
          {isGoldenWindow && goldenRating > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-base",
                      i < goldenRating ? "opacity-100" : "opacity-25"
                    )}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="text-xs font-medium text-yellow-800/80">
                {goldenDaysRemaining === 1
                  ? t('cards:goldenWindow.lastDay', { defaultValue: 'Son gün!' })
                  : t('cards:goldenWindow.daysRemaining', { defaultValue: '{{days}} gün kaldı', days: goldenDaysRemaining })}
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-xl px-3 py-1.5 text-center",
            isGoldenWindow ? "bg-yellow-800/20" : "bg-white/10"
          )}
        >
          <span
            className={cn(
              "text-2xl font-bold",
              isGoldenWindow ? "text-yellow-900" : "text-white"
            )}
          >
            {daysUntilPayment}
          </span>
          <p
            className={cn(
              "text-xs",
              isGoldenWindow ? "text-yellow-800" : "text-white/70"
            )}
          >
            {t('cards:todaysCard.daysLabel')}
          </p>
        </div>
      </div>

      {/* Card Info */}
      <div className="relative mt-5 flex items-center justify-between">
        <div>
          <p
            className={cn(
              "text-xs",
              isGoldenWindow ? "text-yellow-800/70" : "text-white/60"
            )}
          >
            {t('cards:todaysCard.availableLimit')}
          </p>
          <p
            className={cn(
              "text-xl font-bold",
              isGoldenWindow ? "text-yellow-900" : "text-white"
            )}
          >
            {isPrivate ? '***' : formatCurrency(card.availableLimit)}
          </p>
        </div>

        <button
          onClick={onShopClick}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all",
            isGoldenWindow
              ? "bg-yellow-900 text-yellow-100 hover:bg-yellow-800"
              : "bg-white text-slate-900 hover:bg-white/90"
          )}
        >
          <ShoppingBag className="h-5 w-5" />
          <span>{t('cards:todaysCard.shop')}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Recommendation */}
      <div
        className={cn(
          "relative mt-4 rounded-xl p-3",
          isGoldenWindow ? "bg-yellow-800/20" : "bg-white/10"
        )}
      >
        <p
          className={cn(
            "text-sm",
            isGoldenWindow ? "text-yellow-900" : "text-white/90"
          )}
        >
          {recommendation}
        </p>
      </div>

      {/* Why Golden Window? - Expandable */}
      {isGoldenWindow && (
        <div className="relative mt-3">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all",
              "bg-yellow-800/10 text-yellow-800 hover:bg-yellow-800/20"
            )}
          >
            <Info className="h-3.5 w-3.5" />
            {t('cards:goldenWindow.whyTitle', { defaultValue: 'Neden Altın Pencere?' })}
            {showExplanation ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showExplanation && (
            <div className="mt-2 rounded-xl bg-yellow-800/15 p-3 space-y-2 text-xs text-yellow-900">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="font-semibold">
                  {t('cards:goldenWindow.whyBody', {
                    defaultValue: 'Hesap kesim: {{statement}} → Sonraki ekstre: {{nextStatement}} → Son ödeme: {{due}} → Toplam vade: {{days}} gün',
                    statement: formatShortDate(new Date(currentYear, currentMonth, statementDay)),
                    nextStatement: formatShortDate(nextStatement),
                    due: formatShortDate(nextDue),
                    days: graceDays,
                  })}
                </span>
              </div>
              <p className="opacity-80">
                {t('cards:calendar.goldenWindowExplanation')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
