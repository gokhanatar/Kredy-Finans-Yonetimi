import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Account, CurrencyCode, KMH_CONSTANTS } from '@/types/familyFinance';
import { BANK_OPTIONS } from '@/types/finance';
import { parseTurkishNumber } from '@/lib/financeUtils';
import { validateKMHLimit } from '@/lib/kmhUtils';

interface BankAccountFormProps {
  account?: Account;
  onSubmit: (data: Omit<Account, 'id'>) => void;
  onClose: () => void;
}

const ACCOUNT_COLORS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-teal-500 to-teal-700',
];

export function BankAccountForm({ account, onSubmit, onClose }: BankAccountFormProps) {
  const { t } = useTranslation(['family', 'common']);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: account?.name || '',
      bankName: account?.bankName || '',
      balance: account?.balance?.toString() || '0',
      currency: account?.currency || 'TRY' as CurrencyCode,
      color: account?.color || ACCOUNT_COLORS[0],
      iban: account?.iban || '',
      lastFourDigits: account?.lastFourDigits || '',
      kmhEnabled: account?.kmhEnabled || false,
      kmhLimit: account?.kmhLimit?.toString() || '',
      kmhInterestRate: account?.kmhInterestRate?.toString() || KMH_CONSTANTS.DEFAULT_INTEREST_RATE.toString(),
      kmhDefaultRate: account?.kmhDefaultRate?.toString() || KMH_CONSTANTS.DEFAULT_DEFAULT_RATE.toString(),
      monthlyIncome: account?.monthlyIncome?.toString() || '',
    },
  });

  const kmhEnabled = watch('kmhEnabled');
  const kmhLimitVal = watch('kmhLimit');
  const monthlyIncomeVal = watch('monthlyIncome');

  const kmhValidation = kmhEnabled && kmhLimitVal && monthlyIncomeVal
    ? validateKMHLimit(parseTurkishNumber(kmhLimitVal), parseTurkishNumber(monthlyIncomeVal))
    : null;

  const onFormSubmit = (data: any) => {
    const accountData: Omit<Account, 'id'> = {
      name: data.name,
      type: 'bank',
      balance: parseTurkishNumber(data.balance),
      currency: data.currency,
      icon: 'building-2',
      color: data.color,
      bankName: data.bankName,
      isActive: true,
      iban: data.iban || undefined,
      lastFourDigits: data.lastFourDigits || undefined,
      kmhEnabled: data.kmhEnabled,
      kmhLimit: data.kmhEnabled ? parseTurkishNumber(data.kmhLimit) : undefined,
      kmhInterestRate: data.kmhEnabled ? parseTurkishNumber(data.kmhInterestRate) : undefined,
      kmhDefaultRate: data.kmhEnabled ? parseTurkishNumber(data.kmhDefaultRate) : undefined,
      monthlyIncome: data.monthlyIncome ? parseTurkishNumber(data.monthlyIncome) : undefined,
      kmhLastNegativeDate: account?.kmhLastNegativeDate,
      kmhAccruedInterest: account?.kmhAccruedInterest,
    };
    onSubmit(accountData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Bank Selection */}
      <div className="space-y-2">
        <Label>{t('accounts.form.bankName')}</Label>
        <Select
          value={watch('bankName')}
          onValueChange={(v) => setValue('bankName', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('accounts.form.bankNamePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {BANK_OPTIONS.map((bank) => (
              <SelectItem key={bank.id} value={bank.name}>
                {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Account Name */}
      <div className="space-y-2">
        <Label>{t('accounts.form.name')}</Label>
        <Input
          {...register('name', { required: true })}
          placeholder={t('accounts.form.namePlaceholder')}
        />
      </div>

      {/* Balance */}
      <div className="space-y-2">
        <Label>{t('accounts.form.balance')}</Label>
        <Input
          type="text"
          inputMode="decimal"
          {...register('balance')}
          placeholder="0"
        />
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label>{t('accounts.form.currency')}</Label>
        <Select
          value={watch('currency')}
          onValueChange={(v) => setValue('currency', v as CurrencyCode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRY">{t('accounts.currencyOptions.TRY')}</SelectItem>
            <SelectItem value="USD">{t('accounts.currencyOptions.USD')}</SelectItem>
            <SelectItem value="EUR">{t('accounts.currencyOptions.EUR')}</SelectItem>
            <SelectItem value="GBP">{t('accounts.currencyOptions.GBP')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* IBAN */}
      <div className="space-y-2">
        <Label>IBAN</Label>
        <Input
          {...register('iban')}
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          maxLength={32}
        />
      </div>

      {/* Last 4 Digits */}
      <div className="space-y-2">
        <Label>{t('accounts.bankAccountForm.lastFour', { defaultValue: 'Son 4 Hane' })}</Label>
        <Input
          {...register('lastFourDigits')}
          placeholder="1234"
          maxLength={4}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label>{t('accounts.form.color')}</Label>
        <div className="flex gap-2 flex-wrap">
          {ACCOUNT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} transition-all ${watch('color') === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              onClick={() => setValue('color', color)}
            />
          ))}
        </div>
      </div>

      {/* KMH Section */}
      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">
              {t('accounts.kmh.title', { defaultValue: 'KMH (Kredili Mevduat Hesabı)' })}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('accounts.kmh.subtitle', { defaultValue: 'Eksi bakiye faiz hesaplaması' })}
            </p>
          </div>
          <Switch
            checked={kmhEnabled}
            onCheckedChange={(v) => setValue('kmhEnabled', v)}
          />
        </div>

        {kmhEnabled && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>{t('accounts.kmh.limit', { defaultValue: 'KMH Limiti (₺)' })}</Label>
              <Input
                type="text"
                inputMode="decimal"
                {...register('kmhLimit')}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('accounts.kmh.monthlyIncome', { defaultValue: 'Aylık Gelir (₺)' })}</Label>
              <Input
                type="text"
                inputMode="decimal"
                {...register('monthlyIncome')}
                placeholder={t('accounts.kmh.monthlyIncomePlaceholder', { defaultValue: 'BDDK limit doğrulaması için' })}
              />
              {kmhValidation && !kmhValidation.isValid && (
                <p className="text-xs text-destructive">{kmhValidation.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">{t('accounts.kmh.interestRate', { defaultValue: 'Akdi Faiz (%/ay)' })}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  {...register('kmhInterestRate')}
                  placeholder={KMH_CONSTANTS.DEFAULT_INTEREST_RATE.toString()}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('accounts.kmh.defaultRate', { defaultValue: 'Temerrüt Faiz (%/ay)' })}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  {...register('kmhDefaultRate')}
                  placeholder={KMH_CONSTANTS.DEFAULT_DEFAULT_RATE.toString()}
                />
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 p-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t('accounts.kmh.bddkNote', { defaultValue: 'BDDK kuralı: KMH limiti aylık gelirin en fazla 2 katı olabilir. TCMB Ocak 2026: Akdi %4,25/ay, Temerrüt %4,55/ay. Vergiler: KKDF %15 + BSMV %5 = %20' })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" className="flex-1">
          {account ? t('common:actions.save') : t('accounts.addAccount')}
        </Button>
      </div>
    </form>
  );
}
