import { useTranslation } from 'react-i18next';
import { CreditCard } from "@/types/finance";
import { formatCurrency, getStatusColor } from "@/lib/financeUtils";
import { CreditCard as CreditCardIcon, Sparkles, Building2, Users, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/hooks/usePrivacyMode";

interface CreditCardWidgetProps {
  card: CreditCard;
  isGoldenWindow?: boolean;
  goldenRating?: number;
  goldenDaysRemaining?: number;
  recommendation?: string;
  onClick?: () => void;
  onPayClick?: () => void;
}

export function CreditCardWidget({
  card,
  isGoldenWindow = false,
  goldenRating = 0,
  goldenDaysRemaining = 0,
  recommendation,
  onClick,
  onPayClick,
}: CreditCardWidgetProps) {
  const { t } = useTranslation(['cards']);
  const { isPrivate } = usePrivacyMode();
  const utilizationRate = (card.currentDebt / card.limit) * 100;
  const statusColor = getStatusColor(utilizationRate);
  const isTicari = card.cardType === "ticari";

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 cursor-pointer card-hover",
        "bg-gradient-to-br",
        card.color,
        isGoldenWindow && "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
      )}
    >
      {/* Golden Window Badge */}
      {isGoldenWindow && (
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-yellow-400/30 blur-xl" />
      )}
      {isGoldenWindow && !isTicari && (
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 rounded-full bg-yellow-400/90 px-2.5 py-1 text-xs font-semibold text-yellow-900">
            <Sparkles className="h-3 w-3" />
            {t('cards:goldenWindow.label')}
          </div>
          {goldenRating > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-yellow-400/70 px-2 py-0.5">
              <span className="text-[10px]">
                {'⭐'.repeat(goldenRating)}{'·'.repeat(5 - goldenRating)}
              </span>
              <span className="text-[9px] font-medium text-yellow-900">
                {goldenDaysRemaining === 1 ? t('cards:goldenWindow.lastDay', { defaultValue: 'Son gün' }) : `${goldenDaysRemaining}g`}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Shared with Family Badge */}
      {card.sharedWithFamily && (
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
          <Users className="h-2.5 w-2.5" />
          {t('cards:creditCardWidget.shared')}
        </div>
      )}

      {/* Ticari Badge */}
      {isTicari && (
        <div className={cn(
          "absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
          isGoldenWindow 
            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-900"
            : "bg-amber-500 text-white"
        )}>
          <Building2 className="h-3 w-3" />
          {isGoldenWindow ? t('cards:type.commercialGolden') : t('cards:type.commercialBadge')}
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/70">{card.bankName}</p>
          <h3 className="text-lg font-bold text-white">{card.cardName}</h3>
        </div>
        {isTicari ? (
          <Building2 className="h-8 w-8 text-white/50" />
        ) : (
          <CreditCardIcon className="h-8 w-8 text-white/50" />
        )}
      </div>

      {/* Card Number */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-lg tracking-widest text-white/80">
          •••• •••• •••• {card.lastFourDigits}
        </span>
      </div>

      {/* Balance Info */}
      <div className="mt-5 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-white/60">{t('cards:creditCardWidget.debt')}</p>
            <p className="text-xl font-bold text-white">
              {isPrivate ? '***' : formatCurrency(card.currentDebt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">{t('cards:creditCardWidget.limit')}</p>
            <p className="text-sm font-medium text-white/80">
              {isPrivate ? '***' : formatCurrency(card.limit)}
            </p>
          </div>
        </div>

        {/* Utilization Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/70">
            <span>{t('cards:creditCardWidget.utilization')}</span>
            <span className="font-medium">%{utilizationRate.toFixed(0)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                statusColor === "success" && "bg-emerald-400",
                statusColor === "warning" && "bg-amber-400",
                statusColor === "danger" && "bg-red-400"
              )}
              style={{ width: `${utilizationRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <p className="mt-3 rounded-lg bg-white/10 p-2 text-xs text-white/90">
          {recommendation}
        </p>
      )}

      {/* Quick Payment Button */}
      {card.currentDebt > 0 && onPayClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPayClick();
          }}
          className="mt-3 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25 active:bg-white/30"
        >
          <Banknote className="h-3.5 w-3.5" />
          {t('cards:creditCardWidget.makePayment')}
        </button>
      )}
    </div>
  );
}
