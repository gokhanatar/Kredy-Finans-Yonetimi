import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  CreditCard as CreditCardIcon,

  Building2,
  Calendar,
  Percent,
  AlertTriangle,
  Trash2,
  Info,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  BANK_OPTIONS,
  FINANCIAL_CONSTANTS,
} from "@/types/finance";
import { formatCurrency, formatNumber, parseTurkishNumber, getStatusColor } from "@/lib/financeUtils";

const CARD_COLOR_OPTIONS = [
  { id: "blue", labelKey: "colors.blue", color: "from-blue-600 to-blue-800", dot: "bg-blue-500" },
  { id: "emerald", labelKey: "colors.emerald", color: "from-emerald-600 to-emerald-800", dot: "bg-emerald-500" },
  { id: "violet", labelKey: "colors.violet", color: "from-violet-600 to-violet-800", dot: "bg-violet-500" },
  { id: "rose", labelKey: "colors.rose", color: "from-rose-600 to-rose-800", dot: "bg-rose-500" },
  { id: "amber", labelKey: "colors.amber", color: "from-amber-600 to-amber-800", dot: "bg-amber-500" },
  { id: "teal", labelKey: "colors.teal", color: "from-teal-600 to-teal-800", dot: "bg-teal-500" },
  { id: "indigo", labelKey: "colors.indigo", color: "from-indigo-600 to-indigo-800", dot: "bg-indigo-500" },
  { id: "pink", labelKey: "colors.pink", color: "from-pink-600 to-pink-800", dot: "bg-pink-500" },
  { id: "cyan", labelKey: "colors.cyan", color: "from-cyan-600 to-cyan-800", dot: "bg-cyan-500" },
  { id: "orange", labelKey: "colors.orange", color: "from-orange-600 to-orange-800", dot: "bg-orange-500" },
  { id: "purple", labelKey: "colors.purple", color: "from-purple-600 to-purple-800", dot: "bg-purple-500" },
  { id: "red", labelKey: "colors.red", color: "from-red-600 to-red-800", dot: "bg-red-500" },
];

const LIMIT_MAX_BIREYSEL = 2_000_000;
const LIMIT_MAX_TICARI = 25_000_000;
const MANUAL_LIMIT_MAX_BIREYSEL = 99_999_999;
const MANUAL_LIMIT_MAX_TICARI = 999_999_999;

const createCardFormSchema = (t: (key: string) => string) => z.object({
  bankId: z.string().min(1, t('form.bankError')),
  cardName: z.string().min(2, t('form.cardNameError')),
  lastFourDigits: z
    .string()
    .length(4, t('form.lastFourError'))
    .regex(/^\d{4}$/, t('form.lastFourNumeric')),
  cardType: z.enum(["bireysel", "ticari"]),
  cardColor: z.string().min(1, t('form.cardColorError')),
  limit: z.number().min(1000, t('form.limitMin')).max(MANUAL_LIMIT_MAX_TICARI, t('form.limitMax')),
  currentDebt: z.number().min(0, t('form.debtNegative')),
  statementDate: z.number().min(1).max(31),
  interestRate: z.number().min(0).max(10),
});

type CardFormData = z.infer<ReturnType<typeof createCardFormSchema>>;

interface CardFormProps {
  card?: CreditCard;
  onSubmit: (card: CreditCard) => void;
  onDelete?: (cardId: string) => void;
  onClose: () => void;
  isFamilyContext?: boolean;
}

export function CardForm({ card, onSubmit, onDelete, onClose, isFamilyContext = false }: CardFormProps) {
  const { t } = useTranslation(['cards', 'common']);
  const isEditing = !!card;
  const [manualLimitMode, setManualLimitMode] = useState(false);
  const [manualDebtMode, setManualDebtMode] = useState(false);
  const [sharedWithFamily, setSharedWithFamily] = useState(isFamilyContext ? true : (card?.sharedWithFamily ?? false));
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CardFormData>({
    resolver: zodResolver(createCardFormSchema(t)),
    defaultValues: card
      ? {
          bankId: BANK_OPTIONS.find((b) => b.name === card.bankName)?.id || "diger",
          cardName: card.cardName,
          lastFourDigits: card.lastFourDigits,
          cardType: card.cardType,
          cardColor: CARD_COLOR_OPTIONS.find((c) => c.color === card.color)?.id || "blue",
          limit: card.limit,
          currentDebt: card.currentDebt,
          statementDate: card.statementDate,
          interestRate: card.interestRate,
        }
      : {
          bankId: "",
          cardName: "",
          lastFourDigits: "",
          cardType: "bireysel",
          cardColor: "blue",
          limit: 25000,
          currentDebt: 0,
          statementDate: 15,
          interestRate: FINANCIAL_CONSTANTS.CASH_ADVANCE_RATE,
        },
  });

  const watchedValues = watch();
  const selectedBank = BANK_OPTIONS.find((b) => b.id === watchedValues.bankId);
  const selectedColor = CARD_COLOR_OPTIONS.find((c) => c.id === watchedValues.cardColor);
  const sliderMaxLimit = watchedValues.cardType === "ticari" ? LIMIT_MAX_TICARI : LIMIT_MAX_BIREYSEL;
  const manualMaxLimit = watchedValues.cardType === "ticari" ? MANUAL_LIMIT_MAX_TICARI : MANUAL_LIMIT_MAX_BIREYSEL;
  const currentMaxLimit = manualLimitMode ? manualMaxLimit : sliderMaxLimit;
  const sliderStep = sliderMaxLimit > 5_000_000 ? 50_000 : 5_000;
  const utilizationRate = watchedValues.limit > 0
    ? (watchedValues.currentDebt / watchedValues.limit) * 100
    : 0;
  const statusColor = getStatusColor(utilizationRate);
  const dueDate = ((watchedValues.statementDate || 15) % 31) + 10;
  const minPaymentRate = watchedValues.limit >= FINANCIAL_CONSTANTS.HIGH_LIMIT_THRESHOLD
    ? FINANCIAL_CONSTANTS.HIGH_LIMIT_MIN_PAYMENT
    : FINANCIAL_CONSTANTS.LOW_LIMIT_MIN_PAYMENT;

  // Clamp limit when switching card type
  useEffect(() => {
    if (watchedValues.limit > currentMaxLimit) {
      setValue("limit", currentMaxLimit);
    }
  }, [watchedValues.cardType, currentMaxLimit, watchedValues.limit, setValue]);

  const handleFormSubmit = (data: CardFormData) => {
    const bank = BANK_OPTIONS.find((b) => b.id === data.bankId);
    const colorOption = CARD_COLOR_OPTIONS.find((c) => c.id === data.cardColor);
    const newCard: CreditCard = {
      id: card?.id || `card-${Date.now()}`,
      bankName: bank?.name || t('common:other'),
      cardName: data.cardName,
      lastFourDigits: data.lastFourDigits,
      cardType: data.cardType,
      limit: data.limit,
      currentDebt: data.currentDebt,
      availableLimit: data.limit - data.currentDebt,
      minimumPayment: (data.currentDebt * minPaymentRate) / 100,
      statementDate: data.statementDate,
      dueDate: dueDate > 31 ? dueDate - 31 : dueDate,
      interestRate: data.interestRate,
      color: colorOption?.color || "from-blue-600 to-blue-800",
      sharedWithFamily,
    };
    onSubmit(newCard);
  };

  return (
    <div className="rounded-2xl bg-card">
      {/* Header */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <CreditCardIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? t('editCard') : t('newCard')}
              </h2>
              <p className="text-sm text-white/70">
                {t('form.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 p-5">
        {/* Card Type Selection - Prominent */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue("cardType", "bireysel")}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
              watchedValues.cardType === "bireysel"
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/30 hover:bg-secondary/50"
            )}
          >
            <CreditCardIcon className={cn(
              "h-6 w-6",
              watchedValues.cardType === "bireysel" ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "font-medium",
              watchedValues.cardType === "bireysel" ? "text-primary" : "text-muted-foreground"
            )}>{t('type.individual')}</span>
            <span className="text-xs text-muted-foreground">{t('type.individualDesc')}</span>
          </button>
          <button
            type="button"
            onClick={() => setValue("cardType", "ticari")}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
              watchedValues.cardType === "ticari"
                ? "border-amber-500 bg-amber-500/10"
                : "border-border bg-secondary/30 hover:bg-secondary/50"
            )}
          >
            <Building2 className={cn(
              "h-6 w-6",
              watchedValues.cardType === "ticari" ? "text-amber-500" : "text-muted-foreground"
            )} />
            <span className={cn(
              "font-medium",
              watchedValues.cardType === "ticari" ? "text-amber-500" : "text-muted-foreground"
            )}>{t('type.commercial')}</span>
            <span className="text-xs text-muted-foreground">{t('type.commercialDesc')}</span>
          </button>
        </div>

        {/* Info Box */}
        <div className={cn(
          "flex items-start gap-3 rounded-xl p-4",
          watchedValues.cardType === "ticari" ? "bg-amber-500/10" : "bg-blue-500/10"
        )}>
          <Info className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            watchedValues.cardType === "ticari" ? "text-amber-500" : "text-blue-500"
          )} />
          <div className="text-sm">
            {watchedValues.cardType === "ticari" ? (
              <div className="space-y-1">
                <p className="font-medium text-amber-600 dark:text-amber-400">{t('commercialAdvantages.title')}</p>
                <ul className="list-inside list-disc text-muted-foreground">
                  <li>{t('commercialAdvantages.advantage1')}</li>
                  <li>{t('commercialAdvantages.advantage2')}</li>
                  <li>{t('commercialAdvantages.advantage3')}</li>
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {t('individualInfo')}
              </p>
            )}
          </div>
        </div>

        {/* Bank Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {t('form.bank')}
          </Label>
          <Select
            value={watchedValues.bankId}
            onValueChange={(value) => setValue("bankId", value)}
          >
            <SelectTrigger className={errors.bankId ? "border-destructive" : ""}>
              <SelectValue placeholder={t('form.bankPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {BANK_OPTIONS.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full bg-gradient-to-r",
                        bank.color
                      )}
                    />
                    {bank.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.bankId && (
            <p className="text-sm text-destructive">{errors.bankId.message}</p>
          )}
        </div>

        {/* Card Color Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            {t('form.cardColor')}
          </Label>
          <div className="grid grid-cols-6 gap-2">
            {CARD_COLOR_OPTIONS.map((colorOption) => (
              <button
                key={colorOption.id}
                type="button"
                onClick={() => setValue("cardColor", colorOption.id)}
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-lg transition-all",
                  "bg-gradient-to-br",
                  colorOption.color,
                  watchedValues.cardColor === colorOption.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "hover:opacity-80"
                )}
                title={t(colorOption.labelKey)}
              >
                {watchedValues.cardColor === colorOption.id && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>
          {errors.cardColor && (
            <p className="text-sm text-destructive">{errors.cardColor.message}</p>
          )}
        </div>

        {/* Card Name & Last 4 Digits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('form.cardName')}</Label>
            <Input
              placeholder={t('form.cardNamePlaceholder')}
              {...register("cardName")}
              className={errors.cardName ? "border-destructive" : ""}
            />
            {errors.cardName && (
              <p className="text-sm text-destructive">{errors.cardName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t('form.lastFour')}</Label>
            <Input
              placeholder={t('form.lastFourPlaceholder')}
              maxLength={4}
              inputMode="numeric"
              {...register("lastFourDigits")}
              className={errors.lastFourDigits ? "border-destructive" : ""}
            />
            {errors.lastFourDigits && (
              <p className="text-sm text-destructive">{errors.lastFourDigits.message}</p>
            )}
          </div>
        </div>


        {/* Statement Date */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {t('form.statementDate')}
          </Label>
          <Select
            value={String(watchedValues.statementDate)}
            onValueChange={(value) => setValue("statementDate", Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('form.statementDatePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {t('form.statementDateFormat', { day })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {t('form.dueDate')} <span className="font-medium text-foreground">{t('form.dueDateFormat', { day: dueDate > 31 ? dueDate - 31 : dueDate })}</span>
          </p>
        </div>

        {/* Limit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('form.cardLimit')}</Label>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(watchedValues.limit)}
            </span>
          </div>

          {/* Manual limit toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">{t('form.manualLimit')}</Label>
            <Switch checked={manualLimitMode} onCheckedChange={setManualLimitMode} />
          </div>

          {manualLimitMode ? (
            <Input
              type="text"
              inputMode="decimal"
              value={watchedValues.limit ? formatNumber(watchedValues.limit) : ''}
              onChange={(e) => {
                const val = parseTurkishNumber(e.target.value);
                if (val >= 0 && val <= manualMaxLimit) {
                  setValue("limit", val);
                }
              }}
              placeholder={t('form.manualLimitPlaceholder')}
            />
          ) : (
            <>
              <Slider
                value={[Math.min(watchedValues.limit, sliderMaxLimit)]}
                onValueChange={([value]) => setValue("limit", value)}
                min={1000}
                max={sliderMaxLimit}
                step={sliderStep}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('form.limitRangeMin')}</span>
                <span>{watchedValues.cardType === "ticari" ? t('form.limitRangeMaxCommercial') : t('form.limitRangeMax')}</span>
              </div>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            {t('form.minPaymentRate')} <span className="font-medium text-foreground">%{minPaymentRate}</span>
            {watchedValues.limit >= FINANCIAL_CONSTANTS.HIGH_LIMIT_THRESHOLD && (
              <span className="ml-2 text-amber-500">{t('form.minPaymentHighLimit')}</span>
            )}
          </p>
        </div>

        {/* Current Debt */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('form.currentDebt')}</Label>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(watchedValues.currentDebt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">{t('form.manualDebt', 'Elle giriş')}</Label>
            <Switch checked={manualDebtMode} onCheckedChange={setManualDebtMode} />
          </div>

          {manualDebtMode ? (
            <Input
              type="text"
              inputMode="decimal"
              value={watchedValues.currentDebt ? formatNumber(watchedValues.currentDebt) : ''}
              onChange={(e) => {
                const val = parseTurkishNumber(e.target.value);
                if (val >= 0 && val <= watchedValues.limit) {
                  setValue("currentDebt", val);
                }
              }}
              placeholder={t('form.manualDebtPlaceholder', 'Borç tutarını girin')}
            />
          ) : (
            <Slider
              value={[watchedValues.currentDebt]}
              onValueChange={([value]) => setValue("currentDebt", Math.min(value, watchedValues.limit))}
              min={0}
              max={watchedValues.limit}
              step={100}
              className="py-2"
            />
          )}
          
          {/* Utilization Rate Preview */}
          <div className="space-y-2 rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('form.utilization')}</span>
              <span
                className={cn(
                  "font-bold",
                  statusColor === "success" && "text-emerald-500",
                  statusColor === "warning" && "text-amber-500",
                  statusColor === "danger" && "text-red-500"
                )}
              >
                %{utilizationRate.toFixed(0)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  statusColor === "success" && "bg-emerald-500",
                  statusColor === "warning" && "bg-amber-500",
                  statusColor === "danger" && "bg-red-500"
                )}
                style={{ width: `${Math.min(utilizationRate, 100)}%` }}
              />
            </div>
            {utilizationRate >= FINANCIAL_CONSTANTS.UTILIZATION_DANGER_THRESHOLD && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                <AlertTriangle className="h-4 w-4" />
                {t('form.utilizationWarning')}
              </div>
            )}
          </div>
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            {t('form.interestRate')}
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="10"
              {...register("interestRate", { valueAsNumber: true })}
              className="w-24"
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </div>

        {/* Card Preview */}
        {selectedBank && selectedColor && (
          <div
            className={cn(
              "relative overflow-hidden rounded-xl p-4",
              "bg-gradient-to-br",
              selectedColor.color
            )}
          >
            {/* Ticari Badge */}
            {watchedValues.cardType === "ticari" && (
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5">
                <Building2 className="h-3 w-3 text-white" />
                <span className="text-xs font-medium text-white">{t('type.commercialBadge')}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70">{selectedBank.name}</p>
                <p className="font-bold text-white">{watchedValues.cardName || t('form.cardNamePreview')}</p>
              </div>
              {watchedValues.cardType !== "ticari" && (
                <CreditCardIcon className="h-6 w-6 text-white/50" />
              )}
            </div>
            <p className="mt-3 text-sm tracking-widest text-white/80">
              •••• •••• •••• {watchedValues.lastFourDigits || "0000"}
            </p>
          </div>
        )}

        {/* Family Sharing Toggle */}
        {!isFamilyContext && <div className="flex items-center justify-between rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-sm">👨‍👩‍👧‍👦</span>
            <div>
              <p className="text-sm font-medium">{t('form.shareWithFamily', 'Aileyle Paylaş')}</p>
              <p className="text-[10px] text-muted-foreground">{t('form.shareWithFamilyDesc', 'Bu kart aile grubunda görünsün')}</p>
            </div>
          </div>
          <Switch checked={sharedWithFamily} onCheckedChange={setSharedWithFamily} />
        </div>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {isEditing && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('form.deleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('form.deleteMessage')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(card!.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('common:confirm.yesDelete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" className="flex-1">
            {isEditing ? t('form.updateButton') : t('form.addButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
