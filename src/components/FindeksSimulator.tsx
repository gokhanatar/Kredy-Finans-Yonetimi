import { useState, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { CreditCard } from "@/types/finance";
import { formatCurrency } from "@/lib/financeUtils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info, X, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface FindeksSimulatorProps {
  cards: CreditCard[];
  onClose?: () => void;
}

interface FindeksRecommendation {
  icon: React.ReactNode;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

export function FindeksSimulator({ cards, onClose }: FindeksSimulatorProps) {
  const { t } = useTranslation(['cards']);
  // Simulated monthly payment amount
  const [simulatedPayment, setSimulatedPayment] = useState(0);

  // Calculate current utilization
  const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);
  const totalBalance = cards.reduce((sum, card) => sum + card.currentDebt, 0);
  const currentUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  // Calculate simulated utilization after payment
  const newBalance = Math.max(0, totalBalance - simulatedPayment);
  const simulatedUtilization = totalLimit > 0 ? (newBalance / totalLimit) * 100 : 0;

  // Estimate Findeks score based on utilization
  const getScoreFromUtilization = (utilization: number): number => {
    if (utilization <= 10) return 1650 + Math.floor(Math.random() * 100);
    if (utilization <= 30) return 1450 + Math.floor(Math.random() * 150);
    if (utilization <= 50) return 1250 + Math.floor(Math.random() * 150);
    if (utilization <= 70) return 1050 + Math.floor(Math.random() * 150);
    if (utilization <= 90) return 850 + Math.floor(Math.random() * 150);
    return 550 + Math.floor(Math.random() * 200);
  };

  const currentScore = useMemo(() => getScoreFromUtilization(currentUtilization), [currentUtilization]);
  const simulatedScore = useMemo(() => getScoreFromUtilization(simulatedUtilization), [simulatedUtilization]);
  const scoreDiff = simulatedScore - currentScore;

  // Get score category
  const getScoreCategory = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 1500) return { label: t('cards:findeks.categories.excellent'), color: "text-success", bgColor: "bg-success" };
    if (score >= 1300) return { label: t('cards:findeks.categories.veryGood'), color: "text-success", bgColor: "bg-success" };
    if (score >= 1100) return { label: t('cards:findeks.categories.good'), color: "text-warning", bgColor: "bg-warning" };
    if (score >= 900) return { label: t('cards:findeks.categories.average'), color: "text-warning", bgColor: "bg-warning" };
    if (score >= 700) return { label: t('cards:findeks.categories.low'), color: "text-danger", bgColor: "bg-danger" };
    return { label: t('cards:findeks.categories.veryLow'), color: "text-danger", bgColor: "bg-danger" };
  };

  const currentCategory = getScoreCategory(currentScore);
  const simulatedCategory = getScoreCategory(simulatedScore);

  // Generate recommendations
  const recommendations: FindeksRecommendation[] = useMemo(() => {
    const recs: FindeksRecommendation[] = [];

    // High utilization warning
    if (currentUtilization > 70) {
      recs.push({
        icon: <AlertTriangle className="h-5 w-5 text-danger" />,
        title: t('cards:findeks.recReduceUsage'),
        description: t('cards:findeks.recReduceUsageDesc', { usage: currentUtilization.toFixed(0) }),
        impact: "high",
      });
    } else if (currentUtilization > 30) {
      recs.push({
        icon: <Info className="h-5 w-5 text-warning" />,
        title: t('cards:findeks.recImproveUsage'),
        description: t('cards:findeks.recImproveUsageDesc', { usage: currentUtilization.toFixed(0) }),
        impact: "medium",
      });
    } else {
      recs.push({
        icon: <CheckCircle2 className="h-5 w-5 text-success" />,
        title: t('cards:findeks.recIdealUsage'),
        description: t('cards:findeks.recIdealUsageDesc', { usage: currentUtilization.toFixed(0) }),
        impact: "low",
      });
    }

    // Per-card analysis
    cards.forEach((card) => {
      const cardUtil = (card.currentDebt / card.limit) * 100;
      if (cardUtil > 80) {
        recs.push({
          icon: <TrendingDown className="h-5 w-5 text-danger" />,
          title: t('cards:findeks.recCardWarning', { bank: card.bankName }),
          description: t('cards:findeks.recCardWarningDesc', { usage: cardUtil.toFixed(0) }),
          impact: "high",
        });
      }
    });

    // Payment suggestion
    if (totalBalance > 0) {
      const targetBalance = totalLimit * 0.3; // Target 30% utilization
      const neededPayment = totalBalance - targetBalance;
      if (neededPayment > 0) {
        recs.push({
          icon: <TrendingUp className="h-5 w-5 text-info" />,
          title: t('cards:findeks.recTargetPayment'),
          description: t('cards:findeks.recTargetPaymentDesc', { amount: formatCurrency(neededPayment) }),
          impact: "medium",
        });
      }
    }

    // Limit increase suggestion
    if (currentUtilization > 50 && cards.length > 0) {
      recs.push({
        icon: <Info className="h-5 w-5 text-primary" />,
        title: t('cards:findeks.recLimitIncrease'),
        description: t('cards:findeks.recLimitIncreaseDesc'),
        impact: "low",
      });
    }

    return recs;
  }, [currentUtilization, cards, totalBalance, totalLimit]);

  // Score gauge visualization
  const getGaugeRotation = (score: number): number => {
    const minScore = 0;
    const maxScore = 1900;
    const normalized = (score - minScore) / (maxScore - minScore);
    return normalized * 180 - 90; // -90 to 90 degrees
  };

  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-card-foreground">
            {t('cards:findeks.title')}
          </h2>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {t('cards:findeks.subtitle')}
      </p>

      {/* Score Display */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Current Score */}
        <div className="rounded-xl bg-secondary/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('cards:findeks.currentEstimate')}</p>
          <p className={cn("text-3xl font-bold", currentCategory.color)}>
            {currentScore}
          </p>
          <span className={cn(
            "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white",
            currentCategory.bgColor
          )}>
            {currentCategory.label}
          </span>
          <p className="mt-2 text-xs text-muted-foreground">
            %{currentUtilization.toFixed(0)} {t('cards:findeks.usage')}
          </p>
        </div>

        {/* Simulated Score */}
        <div className="rounded-xl bg-secondary/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('cards:findeks.afterPayment')}</p>
          <p className={cn("text-3xl font-bold", simulatedCategory.color)}>
            {simulatedScore}
          </p>
          <span className={cn(
            "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white",
            simulatedCategory.bgColor
          )}>
            {simulatedCategory.label}
          </span>
          <p className="mt-2 text-xs text-muted-foreground">
            %{simulatedUtilization.toFixed(0)} {t('cards:findeks.usage')}
          </p>
        </div>
      </div>

      {/* Score Difference */}
      {simulatedPayment > 0 && (
        <div className={cn(
          "mt-4 flex items-center justify-center gap-2 rounded-lg p-3",
          scoreDiff > 0 ? "bg-success-muted" : scoreDiff < 0 ? "bg-danger-muted" : "bg-secondary"
        )}>
          {scoreDiff > 0 ? (
            <TrendingUp className="h-5 w-5 text-success" />
          ) : scoreDiff < 0 ? (
            <TrendingDown className="h-5 w-5 text-danger" />
          ) : null}
          <span className={cn(
            "font-medium",
            scoreDiff > 0 ? "text-success" : scoreDiff < 0 ? "text-danger" : "text-muted-foreground"
          )}>
            {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} {t('cards:findeks.scoreChange')}
          </span>
        </div>
      )}

      {/* Payment Simulator */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t('cards:findeks.paymentSimulation')}</label>
          <span className="text-sm font-bold text-primary">
            {formatCurrency(simulatedPayment)}
          </span>
        </div>
        <Slider
          value={[simulatedPayment]}
          onValueChange={(value) => setSimulatedPayment(value[0])}
          max={totalBalance}
          step={100}
          className="mt-3"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>₺0</span>
          <span>{formatCurrency(totalBalance)}</span>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('cards:findeks.limitUsage')}</span>
          <span className="font-medium">
            {formatCurrency(newBalance)} / {formatCurrency(totalLimit)}
          </span>
        </div>
        <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
              simulatedUtilization <= 30
                ? "bg-success"
                : simulatedUtilization <= 70
                ? "bg-warning"
                : "bg-danger"
            )}
            style={{ width: `${Math.min(simulatedUtilization, 100)}%` }}
          />
          {/* Threshold markers */}
          <div className="absolute left-[30%] top-0 h-full w-0.5 bg-success/50" />
          <div className="absolute left-[70%] top-0 h-full w-0.5 bg-danger/50" />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span className="text-success">30% {t('cards:findeks.ideal')}</span>
          <span className="text-danger">70% {t('cards:findeks.risky')}</span>
          <span>100%</span>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold">{t('cards:findeks.recommendations')}</h3>
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 rounded-lg p-3",
              rec.impact === "high" ? "bg-danger-muted" :
              rec.impact === "medium" ? "bg-warning-muted" : "bg-secondary/50"
            )}
          >
            {rec.icon}
            <div>
              <p className="text-sm font-medium">{rec.title}</p>
              <p className="text-xs text-muted-foreground">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-center text-[10px] text-muted-foreground">
        {t('cards:findeks.disclaimer')}
      </p>
    </div>
  );
}
