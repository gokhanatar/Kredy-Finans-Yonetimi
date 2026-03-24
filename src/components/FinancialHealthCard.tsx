import { useTranslation } from 'react-i18next';
import { FinancialHealth } from "@/types/finance";
import { formatCurrency, formatPercentage } from "@/lib/financeUtils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  CreditCard,
  PiggyBank,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/hooks/usePrivacyMode";

interface FinancialHealthCardProps {
  health: FinancialHealth;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FinancialHealthCard({ health, collapsible = false, defaultCollapsed = false }: FinancialHealthCardProps) {
  const { t } = useTranslation(['cards', 'common']);
  const { isPrivate } = usePrivacyMode();
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const privacyAmount = (amount: number) => isPrivate ? '***' : formatCurrency(amount);

  const riskConfig = {
    low: {
      icon: CheckCircle2,
      label: t('financial.good'),
      color: "text-success",
      bg: "bg-success-muted",
    },
    medium: {
      icon: AlertTriangle,
      label: t('financial.medium'),
      color: "text-warning",
      bg: "bg-warning-muted",
    },
    high: {
      icon: TrendingDown,
      label: t('financial.highRisk'),
      color: "text-danger",
      bg: "bg-danger-muted",
    },
  };

  const risk = riskConfig[health.findeksRisk];
  const RiskIcon = risk.icon;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft">
      {/* Header */}
      <div
        className={cn("flex items-center justify-between", collapsible && "cursor-pointer")}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div>
          <h2 className="text-lg font-bold text-card-foreground">
            {t('financial.title')}
          </h2>
          {(!collapsible || isExpanded) && (
            <p className="text-sm text-muted-foreground">{t('financial.subtitle')}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5",
              risk.bg
            )}
          >
            <RiskIcon className={cn("h-4 w-4", risk.color)} />
            <span className={cn("text-sm font-medium", risk.color)}>
              {risk.label}
            </span>
          </div>
          {collapsible && (
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} />
          )}
        </div>
      </div>

      {(!collapsible || isExpanded) && (
        <>
          {/* Stats Grid */}
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                <CreditCard className="h-5 w-5 text-danger" />
              </div>
              <p className="text-xs text-muted-foreground">{t('summary.totalDebt')}</p>
              <p className="mt-0.5 text-sm font-bold text-card-foreground">
                {privacyAmount(health.totalDebt)}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{t('summary.totalLimit')}</p>
              <p className="mt-0.5 text-sm font-bold text-card-foreground">
                {privacyAmount(health.totalLimit)}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <PiggyBank className="h-5 w-5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground">{t('summary.available')}</p>
              <p className="mt-0.5 text-sm font-bold text-card-foreground">
                {privacyAmount(health.totalAvailable)}
              </p>
            </div>
          </div>

          {/* Utilization Rate */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-card-foreground">
                {t('summary.utilization')}
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  health.utilizationRate <= 30
                    ? "text-success"
                    : health.utilizationRate <= 70
                      ? "text-warning"
                      : "text-danger"
                )}
              >
                {formatPercentage(health.utilizationRate)}
              </span>
            </div>
            <ProgressBar
              value={health.utilizationRate}
              max={100}
              size="lg"
              animated
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {health.utilizationRate <= 30
                ? t('form.utilizationHealthy')
                : health.utilizationRate <= 70
                  ? t('form.utilizationMedium')
                  : t('form.utilizationHigh')}
            </p>
          </div>

          {/* Recommendations */}
          {health.recommendations.length > 0 && (
            <div className="mt-5 space-y-2">
              <h3 className="text-sm font-semibold text-card-foreground">
                {t('financial.recommendations')}
              </h3>
              {health.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg bg-primary/5 p-3"
                >
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm text-card-foreground">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
