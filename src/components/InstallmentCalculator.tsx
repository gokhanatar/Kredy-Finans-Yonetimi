import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Calculator, Search, CreditCard, Building2, AlertCircle, Lightbulb, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getDetailedInstallmentLimit, formatCurrency } from "@/lib/financeUtils";
import { DETAILED_INSTALLMENT_LIMITS } from "@/types/finance";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface InstallmentCalculatorProps {
  onClose?: () => void;
}

export function InstallmentCalculator({ onClose }: InstallmentCalculatorProps) {
  const { t } = useTranslation(['loans', 'common']);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [amount, setAmount] = useState<number>(10000);
  const [cardType, setCardType] = useState<"bireysel" | "ticari">("bireysel");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return DETAILED_INSTALLMENT_LIMITS;
    return DETAILED_INSTALLMENT_LIMITS.filter((cat) =>
      cat.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const result = useMemo(() => {
    if (!selectedCategory || amount <= 0) return null;
    return getDetailedInstallmentLimit(selectedCategory, amount, cardType);
  }, [selectedCategory, amount, cardType]);

  const selectedCategoryData = DETAILED_INSTALLMENT_LIMITS.find(
    (c) => c.id === selectedCategory
  );

  const monthlyPayment = result && result.maxInstallments > 0 
    ? amount / result.maxInstallments 
    : 0;

  return (
    <div className="rounded-2xl bg-card p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              {t('loans:installmentCalc.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('loans:installmentCalc.subtitle')}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* How It Works - Accordion */}
      <Accordion type="single" collapsible className="mb-5">
        <AccordionItem value="info" className="border rounded-xl px-4">
          <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              {t('loans:installmentCalc.howItWorks')}
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
            <p>{t('loans:installmentCalc.infoSource')}</p>
            <div className="space-y-2">
              <p className="font-medium text-card-foreground">{t('loans:installmentCalc.infoRulesTitle')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('loans:installmentCalc.infoRule1')}</li>
                <li>{t('loans:installmentCalc.infoRule2')}</li>
                <li>{t('loans:installmentCalc.infoRule3')}</li>
                <li>{t('loans:installmentCalc.infoRule4')}</li>
                <li>{t('loans:installmentCalc.infoRule5')}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-card-foreground">{t('loans:installmentCalc.infoCardTypeTitle')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('loans:installmentCalc.infoCardType1')}</li>
                <li>{t('loans:installmentCalc.infoCardType2')}</li>
              </ul>
            </div>
            <p className="text-xs italic">{t('loans:installmentCalc.infoDisclaimer')}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Inputs */}
      <div className="space-y-5">
        {/* Card Type Toggle */}
        <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{t('loans:installmentCalc.individualCard')}</span>
          </div>
          <Switch
            checked={cardType === "ticari"}
            onCheckedChange={(checked) =>
              setCardType(checked ? "ticari" : "bireysel")
            }
          />
          <div className="flex items-center gap-2">
            <span className="font-medium">{t('loans:installmentCalc.commercialCard')}</span>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('loans:installmentCalc.spendingCategory')}</Label>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('loans:installmentCalc.searchCategory')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Select */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('loans:installmentCalc.selectCategory')}>
                {selectedCategoryData && (
                  <span className="flex items-center gap-2">
                    <span>{selectedCategoryData.icon}</span>
                    <span>{selectedCategoryData.label}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-64 bg-popover">
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                    {category.isProhibited && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {t('loans:installmentCalc.prohibited')}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            {t('loans:installmentCalc.spendingAmount')}
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="pr-12"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              TL
            </span>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Main Result */}
            {result.isProhibited ? (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-danger" />
                <p className="mt-2 text-lg font-bold text-danger">
                  {t('loans:installmentCalc.noInstallment')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.message}
                </p>
              </div>
            ) : (
              <>
                {/* Max Installments Card */}
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('loans:installmentCalc.maxInstallments')}
                  </p>
                  <p className="mt-1 text-4xl font-bold text-primary">
                    {result.maxInstallments}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cardType === "bireysel" ? t('loans:installmentCalc.individual') : t('loans:installmentCalc.commercial')} {t('loans:installmentCalc.card')}
                  </p>
                </div>

                {/* Monthly Payment */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {t('loans:installmentCalc.monthlyInstallment')}
                    </p>
                    <p className="mt-1 text-lg font-bold text-card-foreground">
                      {formatCurrency(monthlyPayment)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t('loans:installmentCalc.totalAmount')}</p>
                    <p className="mt-1 text-lg font-bold text-card-foreground">
                      {formatCurrency(amount)}
                    </p>
                  </div>
                </div>

                {/* Category Info */}
                <div className="rounded-xl bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-card-foreground">
                    {result.message}
                  </p>
                  {result.category?.specialCondition && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('loans:installmentCalc.specialCondition')}: {result.category.specialCondition}
                    </p>
                  )}
                </div>

                {/* Alternative Suggestion */}
                {result.alternativeMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3">
                    <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-card-foreground">
                        {t('loans:installmentCalc.alternativeSuggestion')}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {result.alternativeMessage}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Installment Comparison Table */}
            {!result.isProhibited && result.maxInstallments > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">
                  {t('loans:installmentCalc.installmentOptions')}
                </p>
                <div className="space-y-1.5">
                  {[3, 6, 9, 12].filter(n => n <= result.maxInstallments).map((term) => (
                    <div
                      key={term}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-2 text-sm",
                        term === result.maxInstallments
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-secondary/30"
                      )}
                    >
                      <span className="font-medium">{term} {t('loans:installmentCalc.installment')}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(amount / term)} {t('loans:installmentCalc.perMonth')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Quick Reference */}
            <div className="rounded-xl bg-secondary/20 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t('loans:installmentCalc.inThisCategory')}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span>{t('loans:installmentCalc.individualCard')}</span>
                <Badge variant="outline">
                  {t('loans:installmentCalc.maxInstallment', { count: selectedCategoryData?.bireyselMax || 0 })}
                </Badge>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span>{t('loans:installmentCalc.commercialCard')}</span>
                <Badge variant="outline">
                  {t('loans:installmentCalc.maxInstallment', { count: selectedCategoryData?.ticariMax || 0 })}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* All Categories Quick View */}
        {!selectedCategory && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t('loans:installmentCalc.popularCategories')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DETAILED_INSTALLMENT_LIMITS.slice(0, 8).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors",
                    category.isProhibited
                      ? "bg-danger/10 hover:bg-danger/20"
                      : "bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <span className="text-lg">{category.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{category.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.isProhibited
                        ? t('loans:installmentCalc.prohibited')
                        : `Max ${cardType === "bireysel" ? category.bireyselMax : category.ticariMax} ${t('loans:installmentCalc.maxInstallmentSuffix')}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
