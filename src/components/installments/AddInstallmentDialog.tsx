import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, parseTurkishNumber } from '@/lib/financeUtils';
import { CATEGORIES, INSTALLMENT_OPTIONS } from '@/types/purchase';

interface AddInstallmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  onAdd: (data: {
    cardId: string;
    description: string;
    merchant?: string;
    category: string;
    totalAmount: number;
    installmentCount: number;
    monthlyPayment: number;
    isRetroactive: boolean;
    paidInstallments: number;
    startDate?: string;
    notes?: string;
  }) => void;
}

const formSchema = z.object({
  description: z.string().min(2),
  category: z.string().min(1),
  totalAmount: z.string().min(1),
  installmentCount: z.number().min(2).max(60),
  merchant: z.string().optional(),
  isRetroactive: z.boolean(),
  paidInstallments: z.number().min(0).optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddInstallmentDialog({ open, onOpenChange, cardId, onAdd }: AddInstallmentDialogProps) {
  const { t } = useTranslation(['cards', 'common']);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      category: '',
      totalAmount: '',
      installmentCount: 6,
      merchant: '',
      isRetroactive: false,
      paidInstallments: 0,
      startDate: '',
      notes: '',
    },
  });

  const totalAmountStr = watch('totalAmount');
  const installmentCount = watch('installmentCount');
  const isRetroactive = watch('isRetroactive');
  const paidInstallments = watch('paidInstallments') || 0;

  const totalAmount = parseTurkishNumber(totalAmountStr || '0');
  const monthlyPayment = installmentCount > 0 ? totalAmount / installmentCount : 0;

  const onSubmit = (data: FormValues) => {
    const amount = parseTurkishNumber(data.totalAmount);
    const monthly = amount / data.installmentCount;

    onAdd({
      cardId,
      description: data.description,
      merchant: data.merchant || undefined,
      category: data.category,
      totalAmount: amount,
      installmentCount: data.installmentCount,
      monthlyPayment: Math.round(monthly * 100) / 100,
      isRetroactive: data.isRetroactive,
      paidInstallments: data.isRetroactive ? (data.paidInstallments || 0) : 0,
      startDate: data.startDate || undefined,
      notes: data.notes || undefined,
    });

    reset();
    setShowAdvanced(false);
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
      setShowAdvanced(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('cards:installments.addTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Description */}
          <div className="space-y-1.5">
            <Label>{t('cards:installments.description')}</Label>
            <Input
              {...register('description')}
              placeholder={t('cards:installments.descriptionPlaceholder')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{t('cards:installments.descriptionRequired')}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>{t('cards:installments.category')}</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('cards:installments.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-xs text-destructive">{t('cards:installments.categoryRequired')}</p>
            )}
          </div>

          {/* Total Amount */}
          <div className="space-y-1.5">
            <Label>{t('cards:installments.totalAmount')}</Label>
            <Input
              type="text"
              inputMode="decimal"
              {...register('totalAmount')}
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '');
                setValue('totalAmount', val);
              }}
            />
            {errors.totalAmount && (
              <p className="text-xs text-destructive">{t('cards:installments.amountRequired')}</p>
            )}
          </div>

          {/* Installment Count */}
          <div className="space-y-1.5">
            <Label>{t('cards:installments.installmentCount')}</Label>
            <div className="flex flex-wrap gap-2">
              {INSTALLMENT_OPTIONS.filter((n) => n > 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValue('installmentCount', n)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    installmentCount === n
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Preview */}
          {totalAmount > 0 && installmentCount > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{t('cards:installments.monthlyPayment')}</p>
              <p className="text-lg font-bold">{formatCurrency(monthlyPayment)}</p>
            </div>
          )}

          {/* Advanced Section */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              {t('cards:installments.advanced')}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 pt-3">
                {/* Merchant */}
                <div className="space-y-1.5">
                  <Label>{t('cards:installments.merchant')}</Label>
                  <Input
                    {...register('merchant')}
                    placeholder={t('cards:installments.merchantPlaceholder')}
                  />
                </div>

                {/* Retroactive Toggle */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{t('cards:installments.retroactive')}</p>
                    <p className="text-xs text-muted-foreground">{t('cards:installments.retroactiveDesc')}</p>
                  </div>
                  <Controller
                    name="isRetroactive"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                {/* Paid Installments (shown when retroactive) */}
                {isRetroactive && (
                  <div className="space-y-1.5">
                    <Label>{t('cards:installments.paidCount')}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={installmentCount - 1}
                      value={paidInstallments}
                      onChange={(e) => setValue('paidInstallments', Math.min(parseInt(e.target.value) || 0, installmentCount - 1))}
                    />
                  </div>
                )}

                {/* Start Date */}
                <div className="space-y-1.5">
                  <Label>{t('cards:installments.startDate')}</Label>
                  <Input type="date" {...register('startDate')} />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label>{t('cards:installments.notes')}</Label>
                  <Input
                    {...register('notes')}
                    placeholder={t('cards:installments.notesPlaceholder')}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit */}
          <Button type="submit" className="w-full">
            {t('cards:installments.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
