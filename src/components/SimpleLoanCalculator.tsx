import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  LoanType,
  LOAN_TYPE_LABELS,
  DEFAULT_INTEREST_RATES,
  LOAN_CONSTANTS,
} from "@/types/loan";
import {
  generateAmortizationSchedule,
  calculateEffectiveRate,
} from "@/lib/overdueUtils";

export function SimpleLoanCalculator() {
  const { t } = useTranslation(["loans", "common"]);
  const [loanType, setLoanType] = useState<LoanType>("ihtiyac");
  const [principal, setPrincipal] = useState(100000);
  const [interestRate, setInterestRate] = useState(
    DEFAULT_INTEREST_RATES["ihtiyac"]
  );
  const [termMonths, setTermMonths] = useState(36);

  const handleLoanTypeChange = (type: LoanType) => {
    setLoanType(type);
    setInterestRate(DEFAULT_INTEREST_RATES[type]);
  };

  const calculation = useMemo(() => {
    const effectiveRate = calculateEffectiveRate(interestRate);
    const result = generateAmortizationSchedule(
      principal,
      effectiveRate,
      termMonths
    );
    return { ...result, effectiveRate };
  }, [principal, interestRate, termMonths]);

  return (
    <div className="rounded-2xl bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700">
          <Calculator className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-card-foreground">
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("calculation.subtitle")}
          </p>
        </div>
      </div>

      {/* Kredi Türü */}
      <div className="space-y-2">
        <Label>{t("calculation.loanType")}</Label>
        <Select
          value={loanType}
          onValueChange={(v) => handleLoanTypeChange(v as LoanType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LOAN_TYPE_LABELS) as LoanType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {LOAN_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kredi Tutarı */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("calculation.principal")}</Label>
          <span className="text-base font-bold text-primary">
            {principal.toLocaleString("tr-TR")} ₺
          </span>
        </div>
        <Slider
          value={[principal]}
          onValueChange={(v) => setPrincipal(v[0])}
          min={10000}
          max={2000000}
          step={10000}
        />
        <Input
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(Number(e.target.value))}
        />
      </div>

      {/* Faiz Oranı */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("calculation.interestRate")}</Label>
          <span className="font-medium">%{interestRate}</span>
        </div>
        <Input
          type="number"
          step="0.01"
          value={interestRate}
          onChange={(e) => setInterestRate(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          {t("calculation.effectiveInterest")}: %
          {calculation.effectiveRate.toFixed(2)}
        </p>
      </div>

      {/* Vade */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("calculation.term")}</Label>
          <span className="font-medium">
            {termMonths} {t("calculation.months")}
          </span>
        </div>
        <Slider
          value={[termMonths]}
          onValueChange={(v) => setTermMonths(v[0])}
          min={LOAN_CONSTANTS.MIN_TERM_MONTHS}
          max={LOAN_CONSTANTS.MAX_TERM_MONTHS}
          step={6}
        />
        <div className="flex flex-wrap gap-2">
          {[12, 24, 36, 60, 120].map((m) => (
            <Button
              key={m}
              variant={termMonths === m ? "default" : "outline"}
              size="sm"
              onClick={() => setTermMonths(m)}
            >
              {m === 120 ? `120 (${t("calculation.tenYears")})` : m}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sonuçlar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            {t("results.monthlyPayment")}
          </p>
          <p className="text-xl font-bold text-primary">
            {calculation.monthlyPayment.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ₺
          </p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">
            {t("results.totalPayment")}
          </p>
          <p className="text-xl font-bold">
            {calculation.totalPayment.toLocaleString("tr-TR", {
              minimumFractionDigits: 0,
            })}{" "}
            ₺
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-destructive/10 p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-destructive" />
          <span className="text-sm">{t("results.totalInterestCost")}</span>
        </div>
        <span className="font-bold text-destructive">
          {calculation.totalInterest.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
          })}{" "}
          ₺
        </span>
      </div>
    </div>
  );
}
