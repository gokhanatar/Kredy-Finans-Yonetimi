import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard } from '@/types/finance';
import { PurchaseData, CATEGORIES, INSTALLMENT_OPTIONS, DEFERRED_OPTIONS } from '@/types/purchase';
import { formatCurrency, formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, 
  ShoppingBag, 
  CreditCard as CardIcon,
  Tag,
  Calendar,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReceiptScanButton } from '@/components/ReceiptScanButton';
import type { ParsedReceipt } from '@/lib/receiptParser';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { addMonths } from 'date-fns';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ShoppingFormProps {
  cards: CreditCard[];
  selectedCardId?: string;
  onClose: () => void;
  onSubmit: (purchase: Omit<PurchaseData, 'id'>) => void;
  onViewHistory?: () => void;
}

export type { PurchaseData } from '@/types/purchase';

export function ShoppingForm({ cards, selectedCardId, onClose, onSubmit, onViewHistory }: ShoppingFormProps) {
  const { t } = useTranslation(['cards', 'common']);
  const [cardId, setCardId] = useState<string>(selectedCardId || cards[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [customInstallment, setCustomInstallment] = useState<string>('');
  const [isDeferred, setIsDeferred] = useState<boolean>(false);
  const [deferredMonths, setDeferredMonths] = useState<number>(1);
  
  // Vade farkı state'leri
  const [useCustomInterest, setUseCustomInterest] = useState<boolean>(false);
  const [customInterestType, setCustomInterestType] = useState<'rate' | 'amount'>('rate');
  const [customInterestRate, setCustomInterestRate] = useState<string>('');
  const [customInterestAmount, setCustomInterestAmount] = useState<string>('');

  const selectedCard = cards.find(c => c.id === cardId);
  const parsedAmount = parseTurkishNumber(amount) || 0;
  const selectedCategory = CATEGORIES.find(c => c.value === category);
  
  // Commercial cards get 2x installment limit (max 18 months per BDDK)
  const isCommercialCard = selectedCard?.cardType === 'ticari';
  const baseMaxInstallment = selectedCategory?.maxInstallment || 0;
  const hasCategory = !!selectedCategory;
  const maxInstallment = hasCategory
    ? (isCommercialCard ? Math.min(baseMaxInstallment * 2, 18) : baseMaxInstallment)
    : 0; // 0 = unlimited
  const canDefer = hasCategory ? (selectedCategory?.canDefer ?? false) : true;
  
  // Get effective installment count (custom or selected)
  const effectiveInstallments = customInstallment ? parseInt(customInstallment, 10) || 1 : installments;
  
  // Calculate interest rates
  // Default: 1.99% per installment month, Deferred adds extra 0.5% per deferred month
  const defaultInterestRate = effectiveInstallments > 1 ? 0.0199 * (effectiveInstallments - 1) : 0;
  const deferredInterestRate = isDeferred && deferredMonths > 0 ? 0.005 * deferredMonths : 0;
  
  // Custom interest calculation
  const parsedCustomRate = parseFloat(customInterestRate) || 0;
  const parsedCustomAmount = parseInt(customInterestAmount.replace(/[^0-9]/g, ''), 10) || 0;
  
  let totalInterestRate: number;
  let totalInterestAmount: number;
  
  if (useCustomInterest && customInterestType === 'rate' && parsedCustomRate > 0) {
    // User entered a percentage rate
    totalInterestRate = parsedCustomRate / 100;
    totalInterestAmount = parsedAmount * totalInterestRate;
  } else if (useCustomInterest && customInterestType === 'amount' && parsedCustomAmount > 0) {
    // User entered a fixed amount
    totalInterestAmount = parsedCustomAmount;
    totalInterestRate = parsedAmount > 0 ? parsedCustomAmount / parsedAmount : 0;
  } else {
    // Use default calculation
    totalInterestRate = defaultInterestRate + deferredInterestRate;
    totalInterestAmount = parsedAmount * totalInterestRate;
  }
  
  const totalWithInterest = parsedAmount + totalInterestAmount;
  const monthlyPayment = totalWithInterest / effectiveInstallments;
  
  // Calculate first payment date
  const today = new Date();
  const firstPaymentDate = isDeferred ? addMonths(today, deferredMonths + 1) : addMonths(today, 1);

  const isOverLimit = selectedCard ? parsedAmount > selectedCard.availableLimit : true;
  const isValid = parsedAmount > 0 && cardId && !isOverLimit;

  const handleSubmit = () => {
    if (!isValid || !selectedCard) return;

    const finalInstallments = customInstallment ? parseInt(customInstallment, 10) : installments;
    
    const purchase: Omit<PurchaseData, 'id'> = {
      cardId,
      amount: parsedAmount,
      category,
      description: description || selectedCategory?.label || merchant || t('cards:shopping.defaultDesc'),
      merchant: merchant || undefined,
      installments: finalInstallments,
      monthlyPayment: totalWithInterest / finalInstallments,
      totalAmount: totalWithInterest,
      date: new Date(),
      isDeferred,
      deferredMonths: isDeferred ? deferredMonths : 0,
      firstPaymentDate,
    };

    onSubmit(purchase);
    
    toast({
      title: t('cards:shopping.saved'),
      description: t('cards:shopping.savedDesc', { amount: formatCurrency(parsedAmount) }),
      action: onViewHistory ? (
        <ToastAction altText={t('cards:shopping.viewHistory')} onClick={onViewHistory}>
          {t('cards:shopping.viewHistory')}
        </ToastAction>
      ) : undefined,
    });
    
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
    setAmount(cleaned);
  };

  const handleAmountBlur = () => {
    if (amount) {
      const parsed = parseTurkishNumber(amount);
      if (parsed > 0) {
        setAmount(formatNumber(parsed));
      }
    }
  };

  const displayAmount = amount;

  // Reset deferred when category changes
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    const cat = CATEGORIES.find(c => c.value === value);
    if (cat) {
      if (cat.maxInstallment > 0 && installments > cat.maxInstallment) {
        setInstallments(1);
      }
      if (!cat.canDefer) {
        setIsDeferred(false);
        setDeferredMonths(0);
      }
    }
  };

  return (
    <div className="flex flex-col bg-background max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{t('cards:shopping.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('cards:shopping.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Form - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">
          {/* Card Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CardIcon className="h-4 w-4" />
              {t('cards:shopping.cardSelection')}
            </Label>
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger>
                <SelectValue placeholder={t('cards:shopping.cardPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="flex items-center gap-2">
                        <span className={cn("w-3 h-3 rounded-full bg-gradient-to-br", card.color)} />
                        <span>{card.bankName} •{card.lastFourDigits}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('cards:shopping.limitLabel')}: {formatCurrency(card.availableLimit)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCard && (
              <div className="rounded-lg bg-secondary/50 p-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('cards:shopping.availableLimit')}</span>
                <span className="font-semibold text-foreground">{formatCurrency(selectedCard.availableLimit)}</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {t('cards:shopping.amount')}
              </Label>
              <ReceiptScanButton
                compact
                onResult={(receipt: ParsedReceipt) => {
                  if (receipt.total) {
                    setAmount(formatNumber(receipt.total));
                  }
                  if (receipt.merchant) {
                    setMerchant(receipt.merchant);
                    setDescription(receipt.merchant);
                  }
                  if (receipt.category) {
                    setCategory(receipt.category);
                  }
                }}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₺</span>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                className={cn(
                  "pl-8 text-xl font-semibold",
                  isOverLimit && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
            {isOverLimit && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{t('cards:shopping.limitInsufficient')}</span>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {t('cards:shopping.category')} <span className="text-xs text-muted-foreground">{t('cards:shopping.categoryOptional')}</span>
            </Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('cards:shopping.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      {cat.maxInstallment === 1 && (
                        <span className="text-xs text-muted-foreground">{t('cards:shopping.singlePaymentOnly')}</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Merchant (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="merchant" className="flex items-center gap-2">
              {t('cards:shopping.merchant')} <span className="text-xs text-muted-foreground">{t('cards:shopping.categoryOptional')}</span>
            </Label>
            <Input
              id="merchant"
              placeholder={t('cards:shopping.merchantPlaceholder')}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              {t('cards:shopping.description')} <span className="text-xs text-muted-foreground">{t('cards:shopping.categoryOptional')}</span>
            </Label>
            <Input
              id="description"
              placeholder={t('cards:shopping.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Installments */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('cards:shopping.installments')}
            </Label>
            
            {/* Quick select buttons */}
            <div className="grid grid-cols-4 gap-2">
              {INSTALLMENT_OPTIONS.filter(n => maxInstallment === 0 || n <= maxInstallment).map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setInstallments(n);
                    setCustomInstallment('');
                  }}
                  className={cn(
                    "rounded-lg border-2 py-2 text-sm font-medium transition-all",
                    installments === n && !customInstallment
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  )}
                >
                  {n === 1 ? t('cards:shopping.single') : `${n}`}
                </button>
              ))}
            </div>
            
            {/* Custom installment input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={t('cards:shopping.customInstallment')}
                  value={customInstallment}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    const num = parseInt(val, 10);
                    if (val === '' || (num >= 1 && (maxInstallment === 0 || num <= maxInstallment))) {
                      setCustomInstallment(val);
                    }
                  }}
                  className={cn(
                    maxInstallment > 0 ? "pr-16" : "pr-4",
                    customInstallment && "border-primary"
                  )}
                />
                {maxInstallment > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {t('cards:shopping.maxInstallment')} {maxInstallment}
                  </span>
                )}
              </div>
              {customInstallment && (
                <button
                  onClick={() => setCustomInstallment('')}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {hasCategory && maxInstallment === 1 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {t('cards:shopping.bddkWarning')}
              </p>
            )}
            
            {isCommercialCard && baseMaxInstallment > 1 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t('cards:shopping.commercialAdvantage')} {t('cards:shopping.commercialFormat', { base: baseMaxInstallment, max: maxInstallment })}
              </p>
            )}
          </div>

          {/* Custom Interest / Vade Farkı */}
          {effectiveInstallments > 1 && (
            <div className="space-y-3 rounded-xl bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="customInterest" className="text-base font-medium cursor-pointer">
                      {t('cards:shopping.customInterest')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('cards:shopping.customInterestSubtitle')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="customInterest"
                  checked={useCustomInterest}
                  onCheckedChange={(checked) => {
                    setUseCustomInterest(checked);
                    if (!checked) {
                      setCustomInterestRate('');
                      setCustomInterestAmount('');
                    }
                  }}
                />
              </div>
              
              {useCustomInterest && (
                <div className="space-y-3 pt-2">
                  {/* Interest Type Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCustomInterestType('rate')}
                      className={cn(
                        "rounded-lg border-2 py-2 text-sm font-medium transition-all",
                        customInterestType === 'rate'
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      )}
                    >
                      {t('cards:shopping.interestRate')}
                    </button>
                    <button
                      onClick={() => setCustomInterestType('amount')}
                      className={cn(
                        "rounded-lg border-2 py-2 text-sm font-medium transition-all",
                        customInterestType === 'amount'
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      )}
                    >
                      {t('cards:shopping.interestAmount')}
                    </button>
                  </div>
                  
                  {/* Interest Input */}
                  {customInterestType === 'rate' ? (
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder={t('cards:shopping.interestRatePlaceholder')}
                        value={customInterestRate}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                          if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                            setCustomInterestRate(val);
                          }
                        }}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        %
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₺</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={t('cards:shopping.interestAmountPlaceholder')}
                        value={customInterestAmount ? new Intl.NumberFormat('tr-TR').format(parseInt(customInterestAmount.replace(/[^0-9]/g, ''), 10) || 0) : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/[^0-9]/g, '');
                          setCustomInterestAmount(rawValue);
                        }}
                        className="pl-8"
                      />
                    </div>
                  )}
                  
                  {/* Preview */}
                  {parsedAmount > 0 && totalInterestAmount > 0 && (
                    <div className="rounded-lg bg-amber-500/10 p-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('cards:shopping.interestPreview')}</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          +{formatCurrency(totalInterestAmount)} ({(totalInterestRate * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Deferred Payment */}
          {effectiveInstallments > 1 && canDefer && (
            <div className="space-y-3 rounded-xl bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="deferred" className="text-base font-medium cursor-pointer">
                      {t('cards:shopping.deferred')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('cards:shopping.deferredSubtitle')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="deferred"
                  checked={isDeferred}
                  onCheckedChange={setIsDeferred}
                />
              </div>
              
              {isDeferred && (
                <div className="space-y-2 pt-2">
                  <Label className="text-sm">{t('cards:shopping.deferredDuration')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DEFERRED_OPTIONS.filter(d => d.value > 0).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDeferredMonths(option.value)}
                        className={cn(
                          "rounded-lg border-2 py-2 text-sm font-medium transition-all",
                          deferredMonths === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-foreground hover:border-primary/50"
                        )}
                      >
                        {option.value} {t('cards:shopping.deferredMonths')}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2">
                    <AlertTriangle className="h-3 w-3" />
                    {t('cards:shopping.deferredWarning')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {parsedAmount > 0 && (
            <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {t('cards:shopping.paymentSummary')}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cards:shopping.summaryAmount')}</span>
                  <span className="font-medium">{formatCurrency(parsedAmount)}</span>
                </div>
                
                {(effectiveInstallments > 1 || isDeferred || totalInterestAmount > 0) && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {useCustomInterest ? t('cards:shopping.summaryInterestManual') : isDeferred ? t('cards:shopping.summaryInterestDeferred') : t('cards:shopping.summaryInterestDefault')}
                      </span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        +{formatCurrency(totalInterestAmount)} ({(totalInterestRate * 100).toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('cards:shopping.summaryTotal')}</span>
                      <span className="font-medium">{formatCurrency(totalWithInterest)}</span>
                    </div>
                  </>
                )}
                
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{t('cards:shopping.summaryMonthly')}</span>
                    <span className="text-lg font-bold text-primary">
                      {effectiveInstallments}x {formatCurrency(monthlyPayment)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('cards:shopping.summaryFirstDate')}
                  </span>
                  <span className="font-medium text-foreground">
                    {format(firstPaymentDate, 'd MMMM yyyy', { locale: tr })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button - Fixed at bottom */}
      <div className="border-t border-border p-4 shrink-0 bg-background">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full py-6 text-lg font-semibold"
          size="lg"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          {t('cards:shopping.saveButton')}
        </Button>
      </div>
    </div>
  );
}
