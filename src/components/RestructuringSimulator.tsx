import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Calculator, AlertTriangle, TrendingDown, Clock, Info, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { simulateRestructuring, formatCurrency, calculateTieredInterestRate, calculateEffectiveInterestRate } from "@/lib/financeUtils";
import { FINANCIAL_CONSTANTS } from "@/types/finance";

interface RestructuringSimulatorProps {
  onClose?: () => void;
}

export function RestructuringSimulator({ onClose }: RestructuringSimulatorProps) {
  const { t } = useTranslation(['loans', 'common']);
  const [totalDebt, setTotalDebt] = useState<number>(50000);
  const [cardLimit, setCardLimit] = useState<number>(75000);
  const [termMonths, setTermMonths] = useState<number>(24);
  const [showResults, setShowResults] = useState(false);

  const simulation = useMemo(() => {
    if (totalDebt > 0 && cardLimit > 0) {
      return simulateRestructuring(totalDebt, cardLimit, termMonths);
    }
    return null;
  }, [totalDebt, cardLimit, termMonths]);

  // Tiered interest rate calculation
  const tieredRate = useMemo(() => {
    return calculateTieredInterestRate(totalDebt, false);
  }, [totalDebt]);

  const tieredLateRate = useMemo(() => {
    return calculateTieredInterestRate(totalDebt, true);
  }, [totalDebt]);

  const effectiveRate = useMemo(() => {
    return calculateEffectiveInterestRate(tieredRate);
  }, [tieredRate]);

  const handleCalculate = () => {
    if (totalDebt > 0 && cardLimit > 0) {
      setShowResults(true);
    }
  };

  const riskColors = {
    low: "bg-success/20 text-success border-success/30",
    medium: "bg-warning/20 text-warning border-warning/30",
    high: "bg-danger/20 text-danger border-danger/30",
  };

  const riskLabels = {
    low: t('loans:restructuring.riskLow'),
    medium: t('loans:restructuring.riskMedium'),
    high: t('loans:restructuring.riskHigh'),
  };

  const minimumPaymentRate = cardLimit >= FINANCIAL_CONSTANTS.HIGH_LIMIT_THRESHOLD 
    ? FINANCIAL_CONSTANTS.HIGH_LIMIT_MIN_PAYMENT 
    : FINANCIAL_CONSTANTS.LOW_LIMIT_MIN_PAYMENT;

  return (
    <div className="rounded-2xl bg-card p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              {t('loans:restructuring.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('loans:restructuring.subtitle')}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Inputs */}
      <div className="space-y-5">
        {/* Total Debt Input */}
        <div className="space-y-2">
          <Label htmlFor="totalDebt" className="text-sm font-medium">
            {t('loans:restructuring.totalDebtAmount')}
          </Label>
          <div className="relative">
            <Input
              id="totalDebt"
              type="number"
              value={totalDebt}
              onChange={(e) => setTotalDebt(Number(e.target.value))}
              className="pr-12"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              TL
            </span>
          </div>
          <Slider
            value={[totalDebt]}
            onValueChange={(v) => setTotalDebt(v[0])}
            max={500000}
            min={1000}
            step={1000}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1.000 TL</span>
            <span>500.000 TL</span>
          </div>
        </div>

        {/* Card Limit Input */}
        <div className="space-y-2">
          <Label htmlFor="cardLimit" className="text-sm font-medium">
            {t('loans:restructuring.cardLimit')}
          </Label>
          <div className="relative">
            <Input
              id="cardLimit"
              type="number"
              value={cardLimit}
              onChange={(e) => setCardLimit(Number(e.target.value))}
              className="pr-12"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              TL
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-secondary/50 p-2 text-xs">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span>
              {cardLimit >= FINANCIAL_CONSTANTS.HIGH_LIMIT_THRESHOLD
                ? t('loans:restructuring.limitAboveThreshold', { rate: FINANCIAL_CONSTANTS.HIGH_LIMIT_MIN_PAYMENT })
                : t('loans:restructuring.limitBelowThreshold', { rate: FINANCIAL_CONSTANTS.LOW_LIMIT_MIN_PAYMENT })
              }
            </span>
          </div>
        </div>

        {/* Term Months Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t('loans:restructuring.termDuration')}</Label>
            <Badge variant="secondary" className="font-bold">
              {termMonths} {t('loans:restructuring.month')}
            </Badge>
          </div>
          <Slider
            value={[termMonths]}
            onValueChange={(v) => setTermMonths(v[0])}
            max={FINANCIAL_CONSTANTS.MAX_RESTRUCTURE_MONTHS}
            min={FINANCIAL_CONSTANTS.MIN_RESTRUCTURE_MONTHS}
            step={6}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>6 {t('loans:restructuring.month')}</span>
            <span>60 {t('loans:restructuring.month')}</span>
          </div>
        </div>

        {/* Calculate Button */}
        <Button 
          onClick={handleCalculate} 
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          disabled={totalDebt <= 0 || cardLimit <= 0}
        >
          <Calculator className="mr-2 h-4 w-4" />
          {t('loans:restructuring.calculate')}
        </Button>

        {/* Results */}
        {showResults && simulation && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Risk Badge */}
            <div className="flex justify-center">
              <Badge 
                className={cn(
                  "px-4 py-1.5 text-sm font-semibold border",
                  riskColors[simulation.riskLevel]
                )}
              >
                {riskLabels[simulation.riskLevel]}
              </Badge>
            </div>

            {/* Main Results Card */}
            <Card className="border-0 bg-gradient-to-br from-secondary/80 to-secondary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-center text-sm font-medium text-muted-foreground">
                  {t('loans:restructuring.monthlyInstallment')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-center text-3xl font-bold text-primary">
                  {formatCurrency(simulation.monthlyPayment)}
                </p>
              </CardContent>
            </Card>

            {/* Cost Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t('loans:restructuring.totalPayment')}</p>
                <p className="mt-1 text-lg font-bold text-card-foreground">
                  {formatCurrency(simulation.totalPayment)}
                </p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t('loans:restructuring.totalInterest')}</p>
                <p className="mt-1 text-lg font-bold text-danger">
                  {formatCurrency(simulation.totalInterestCost)}
                </p>
              </div>
            </div>

            {/* Tiered Interest Rate Info */}
            <div className="rounded-xl bg-secondary/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <PiggyBank className="h-4 w-4 text-primary" />
                <span>{t('loans:restructuring.tieredRatesTitle')}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('loans:restructuring.contractualInterest')}</span>
                  <span className="font-medium text-primary">%{tieredRate.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('loans:restructuring.lateInterest')}</span>
                  <span className="font-medium text-danger">%{tieredLateRate.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('loans:restructuring.effectiveRate')}</span>
                  <span className="font-medium">%{effectiveRate.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Tier explanation */}
              <div className="mt-2 rounded-lg bg-primary/5 p-2 text-xs text-muted-foreground">
                {totalDebt < 30000 && (
                  <span>💡 {t('loans:restructuring.tierLow')}</span>
                )}
                {totalDebt >= 30000 && totalDebt <= 180000 && (
                  <span>📊 {t('loans:restructuring.tierMedium')}</span>
                )}
                {totalDebt > 180000 && (
                  <span>⚠️ {t('loans:restructuring.tierHigh')}</span>
                )}
              </div>
            </div>

            {/* Reference Rate Info */}
            <div className="rounded-xl bg-secondary/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('loans:restructuring.tcmbReference')}</span>
                <span className="font-medium">%{FINANCIAL_CONSTANTS.TCMB_REFERENCE_RATE}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('loans:restructuring.restructuringEffective')}</span>
                <span className="font-medium">%{simulation.effectiveRate.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('loans:restructuring.minPaymentRate')}</span>
                <span className="font-medium">%{minimumPaymentRate}</span>
              </div>
            </div>

            {/* Warnings */}
            {simulation.warnings.length > 0 && (
              <div className="space-y-2">
                {simulation.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Findeks Impact */}
            <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">{t('loans:restructuring.findeksImpact')}</p>
                <p className="mt-0.5 text-muted-foreground">{simulation.findeksImpact}</p>
              </div>
            </div>

            {/* Critical Warning */}
            <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <div>
                <p className="font-medium text-danger">{t('loans:restructuring.criticalWarning')}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {t('loans:restructuring.criticalWarningText')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
