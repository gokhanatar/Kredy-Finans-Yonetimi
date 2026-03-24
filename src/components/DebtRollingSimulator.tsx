import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard } from "@/types/finance";
import {
  simulateDebtRolling,
  formatCurrency,
  formatPercentage,
} from "@/lib/financeUtils";
import { FINANCIAL_CONSTANTS } from "@/types/finance";
import {
  ArrowRightLeft,
  AlertTriangle,
  Info,
  Calculator,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DebtRollingSimulatorProps {
  cards: CreditCard[];
  onClose?: () => void;
}

export function DebtRollingSimulator({
  cards,
  onClose,
}: DebtRollingSimulatorProps) {
  const { t } = useTranslation(['loans', 'common']);
  const [sourceCardId, setSourceCardId] = useState<string>("");
  const [targetCardId, setTargetCardId] = useState<string>("");
  const [amount, setAmount] = useState<number>(10000);
  const [months, setMonths] = useState<number>(12);
  const [showResult, setShowResult] = useState(false);

  const sourceCard = cards.find((c) => c.id === sourceCardId);
  const targetCard = cards.find((c) => c.id === targetCardId);

  const canSimulate =
    sourceCard && targetCard && amount > 0 && sourceCard.id !== targetCard.id;

  const simulation =
    canSimulate && sourceCard && targetCard
      ? simulateDebtRolling(sourceCard, targetCard, amount, months)
      : null;

  const handleSimulate = () => {
    if (canSimulate) {
      setShowResult(true);
    }
  };

  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <ArrowRightLeft className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              {t('loans:debtRolling.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('loans:debtRolling.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-info/10 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-sm text-info">
          {t('loans:debtRolling.infoText')}
        </p>
      </div>

      {/* How It Works */}
      <Accordion type="single" collapsible className="mt-4">
        <AccordionItem value="info" className="border rounded-xl px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-violet-500" />
              {t('loans:debtRollingInfo.howItWorks')}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm text-muted-foreground pb-2">
              <p>{t('loans:debtRollingInfo.description')}</p>

              <div>
                <p className="font-semibold text-card-foreground mb-1">{t('loans:debtRollingInfo.ratesTitle')}</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{t('loans:debtRollingInfo.rate1')}</li>
                  <li>{t('loans:debtRollingInfo.rate2')}</li>
                  <li>{t('loans:debtRollingInfo.rate3')}</li>
                  <li>{t('loans:debtRollingInfo.rate4')}</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-card-foreground mb-1">{t('loans:debtRollingInfo.formulaTitle')}</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{t('loans:debtRollingInfo.formula1')}</li>
                  <li>{t('loans:debtRollingInfo.formula2')}</li>
                  <li>{t('loans:debtRollingInfo.formula3')}</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-card-foreground mb-1">{t('loans:debtRollingInfo.riskTitle')}</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{t('loans:debtRollingInfo.risk1')}</li>
                  <li>{t('loans:debtRollingInfo.risk2')}</li>
                  <li>{t('loans:debtRollingInfo.risk3')}</li>
                </ul>
              </div>

              <p className="text-xs italic border-t border-border pt-2">{t('loans:debtRollingInfo.disclaimer')}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Form */}
      <div className="mt-5 space-y-4">
        {/* Source Card */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">
            {t('loans:debtRolling.sourceCard')}
          </label>
          <Select value={sourceCardId} onValueChange={setSourceCardId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('loans:debtRolling.selectCard')} />
            </SelectTrigger>
            <SelectContent>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-4 w-4 rounded bg-gradient-to-br",
                        card.color
                      )}
                    />
                    <span>
                      {card.bankName} - {card.cardName}
                    </span>
                    <span className="text-muted-foreground">
                      ({formatCurrency(card.currentDebt)} {t('loans:debtRolling.debt')})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target Card */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">
            {t('loans:debtRolling.targetCard')}
          </label>
          <Select value={targetCardId} onValueChange={setTargetCardId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('loans:debtRolling.selectCard')} />
            </SelectTrigger>
            <SelectContent>
              {cards
                .filter((c) => c.id !== sourceCardId)
                .map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-4 w-4 rounded bg-gradient-to-br",
                          card.color
                        )}
                      />
                      <span>
                        {card.bankName} - {card.cardName}
                      </span>
                      <span className="text-muted-foreground">
                        ({formatCurrency(card.availableLimit)} {t('loans:debtRolling.available')})
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-card-foreground">
              {t('loans:debtRolling.transferAmount')}
            </label>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(amount)}
            </span>
          </div>
          <Slider
            value={[amount]}
            onValueChange={([val]) => setAmount(val)}
            min={1000}
            max={targetCard?.availableLimit || 50000}
            step={1000}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(1000)}</span>
            <span>
              {formatCurrency(targetCard?.availableLimit || 50000)}
            </span>
          </div>
        </div>

        {/* Months */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-card-foreground">
              {t('loans:debtRolling.paymentTerm')}
            </label>
            <span className="text-lg font-bold text-primary">{months} {t('loans:debtRolling.monthSuffix')}</span>
          </div>
          <Slider
            value={[months]}
            onValueChange={([val]) => setMonths(val)}
            min={3}
            max={FINANCIAL_CONSTANTS.MAX_RESTRUCTURE_MONTHS}
            step={3}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 {t('loans:debtRolling.monthSuffix')}</span>
            <span>{FINANCIAL_CONSTANTS.MAX_RESTRUCTURE_MONTHS} {t('loans:debtRolling.monthSuffix')}</span>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleSimulate}
          disabled={!canSimulate}
          className="w-full gradient-primary text-white"
          size="lg"
        >
          <Calculator className="mr-2 h-5 w-5" />
          {t('loans:debtRolling.calculateCost')}
        </Button>
      </div>

      {/* Results */}
      {showResult && simulation && (
        <div className="mt-5 animate-fade-in space-y-4">
          <div className="h-px bg-border" />

          {/* Cost Breakdown */}
          <div className="rounded-xl bg-secondary/50 p-4">
            <h3 className="mb-3 font-semibold text-card-foreground">
              {t('loans:debtRolling.costDetail')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t('loans:debtRolling.cashAdvanceInterest')} (%{FINANCIAL_CONSTANTS.CASH_ADVANCE_RATE})
                </span>
                <span className="font-medium">
                  {formatCurrency(simulation.cashAdvanceFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  KKDF (%{FINANCIAL_CONSTANTS.KKDF_RATE})
                </span>
                <span className="font-medium">
                  {formatCurrency(simulation.kkdfRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  BSMV (%{FINANCIAL_CONSTANTS.BSMV_RATE})
                </span>
                <span className="font-medium">
                  {formatCurrency(simulation.bsmvRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t('loans:debtRolling.transactionFee')} (%{FINANCIAL_CONSTANTS.TRANSACTION_FEE})
                </span>
                <span className="font-medium">
                  {formatCurrency(simulation.transactionFee)}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-card-foreground">
                  {t('loans:debtRolling.totalCost')}
                </span>
                <span className="font-bold text-danger">
                  {formatCurrency(simulation.totalCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">{t('loans:debtRolling.monthlyPayment')}</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {formatCurrency(simulation.monthlyPayment)}
              </p>
            </div>
            <div className="rounded-xl bg-danger/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">{t('loans:debtRolling.totalPayment')}</p>
              <p className="mt-1 text-xl font-bold text-danger">
                {formatCurrency(simulation.totalPayment)}
              </p>
            </div>
          </div>

          {/* Warnings */}
          {simulation.warnings.length > 0 && (
            <div className="space-y-2">
              {simulation.warnings.map((warning, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-2 rounded-xl p-3",
                    simulation.riskLevel === "high"
                      ? "bg-danger/10"
                      : "bg-warning/10"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      simulation.riskLevel === "high"
                        ? "text-danger"
                        : "text-warning"
                    )}
                  />
                  <p
                    className={cn(
                      "text-sm",
                      simulation.riskLevel === "high"
                        ? "text-danger"
                        : "text-warning"
                    )}
                  >
                    {warning}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Risk Level Badge */}
          <div className="flex justify-center">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2",
                simulation.riskLevel === "low" && "bg-success/10 text-success",
                simulation.riskLevel === "medium" &&
                  "bg-warning/10 text-warning",
                simulation.riskLevel === "high" && "bg-danger/10 text-danger"
              )}
            >
              <span className="text-sm font-semibold">
                {t('loans:debtRolling.riskLevel')}:{" "}
                {simulation.riskLevel === "low"
                  ? t('loans:debtRolling.riskLow')
                  : simulation.riskLevel === "medium"
                    ? t('loans:debtRolling.riskMedium')
                    : t('loans:debtRolling.riskHigh')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
