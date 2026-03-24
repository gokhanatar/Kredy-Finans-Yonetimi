import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RecurringIncome,
  FamilyTransactionCategory,
  INCOME_CATEGORIES,
  RECURRING_INCOME_PRESETS,
  INCOME_FREQUENCY_LABELS,
  IncomeFrequency,
  CurrencyCode,
} from '@/types/familyFinance';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { toast } from '@/hooks/use-toast';

interface RecurringIncomeFormProps {
  onSubmit: (data: Omit<RecurringIncome, 'id'>) => void;
  onClose: () => void;
  editIncome?: RecurringIncome;
}

export function RecurringIncomeForm({ onSubmit, onClose, editIncome }: RecurringIncomeFormProps) {
  const { t } = useTranslation(['family', 'finance', 'common']);
  const [name, setName] = useState(editIncome?.name || '');
  const [amount, setAmount] = useState(editIncome?.amount ? formatNumber(editIncome.amount) : '');
  const [frequency, setFrequency] = useState<IncomeFrequency>(editIncome?.frequency || 'monthly');
  const [dayOfMonth, setDayOfMonth] = useState(editIncome?.dayOfMonth?.toString() || '1');
  const [category, setCategory] = useState<FamilyTransactionCategory>(editIncome?.category || 'maas');
  const [icon, setIcon] = useState(editIncome?.icon || 'coins');
  const [notes, setNotes] = useState(editIncome?.notes || '');

  const selectPreset = (preset: typeof RECURRING_INCOME_PRESETS[number]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setCategory(preset.category);
    setFrequency(preset.frequency);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTurkishNumber(amount);
    if (!name.trim()) {
      toast({ title: t('incomeSection.nameRequired', { defaultValue: 'Gelir adı zorunludur' }), variant: 'destructive' });
      return;
    }
    if (!parsed || parsed <= 0) {
      toast({ title: t('incomeSection.amountRequired', { defaultValue: 'Geçerli bir tutar giriniz' }), variant: 'destructive' });
      return;
    }

    onSubmit({
      name: name.trim(),
      amount: parsed,
      currency: 'TRY' as CurrencyCode,
      category,
      frequency,
      dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) || 1 : undefined,
      isActive: editIncome?.isActive ?? true,
      startDate: editIncome?.startDate || new Date().toISOString(),
      icon,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          {editIncome ? t('incomeSection.title') : t('incomeSection.addIncome')}
        </h3>
      </div>

      {/* Presets */}
      {!editIncome && (
        <div>
          <Label className="mb-2 block">{t('incomeSection.systematic')}</Label>
          <div className="flex flex-wrap gap-2">
            {RECURRING_INCOME_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => selectPreset(p)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  name === p.name ? 'bg-green-600 text-white' : 'hover:bg-secondary'
                }`}
              >
                <CategoryIcon name={p.icon} size={14} className="inline-block mr-1" />{p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>{t('incomeSection.incomeSources')}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('transactions.form.descriptionPlaceholder')} required />
      </div>

      <div>
        <Label>{t('transactions.form.amount')}</Label>
        <Input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
            setAmount(cleaned);
          }}
          onBlur={() => {
            if (amount) {
              const parsed = parseTurkishNumber(amount);
              if (parsed > 0) setAmount(formatNumber(parsed));
            }
          }}
          placeholder={t('transactions.form.amountPlaceholder')}
          required
          className="text-lg"
        />
      </div>

      {/* Frequency */}
      <div>
        <Label>{t('subscriptions.form.cycle')}</Label>
        <Select value={frequency} onValueChange={(v) => setFrequency(v as IncomeFrequency)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(INCOME_FREQUENCY_LABELS) as [IncomeFrequency, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day of month for monthly incomes */}
      {frequency === 'monthly' && (
        <div>
          <Label>{t('subscriptions.form.billingDate')}</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={dayOfMonth}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              const num = parseInt(val, 10);
              if (val === '' || (num >= 1 && num <= 31)) {
                setDayOfMonth(val);
              }
            }}
            placeholder="1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('incomeSection.monthDay')} {dayOfMonth || '?'}.
          </p>
        </div>
      )}

      {/* Category */}
      <div>
        <Label>{t('transactions.form.category')}</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as FamilyTransactionCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INCOME_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <CategoryIcon name={c.icon} size={16} className="inline-block mr-1" />{c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t('subscriptions.form.notes')}</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('subscriptions.form.notesPlaceholder')} />
      </div>

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
        {editIncome ? t('common:actions.update') : t('incomeSection.addIncome')}
      </Button>
    </form>
  );
}
