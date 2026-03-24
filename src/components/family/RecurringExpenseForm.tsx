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
  RecurringExpense,
  FamilyTransactionCategory,
  EXPENSE_CATEGORIES,
  RECURRING_EXPENSE_PRESETS,
  DAY_LABELS,
  CurrencyCode,
} from '@/types/familyFinance';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { toast } from '@/hooks/use-toast';


interface RecurringExpenseFormProps {
  onSubmit: (data: Omit<RecurringExpense, 'id'>) => void;
  onClose: () => void;
  editExpense?: RecurringExpense;
}

export function RecurringExpenseForm({ onSubmit, onClose, editExpense }: RecurringExpenseFormProps) {
  const { t } = useTranslation(['family', 'finance', 'common']);
  const [name, setName] = useState(editExpense?.name || '');
  const [dailyAmount, setDailyAmount] = useState(editExpense?.dailyAmount ? formatNumber(editExpense.dailyAmount) : '');
  const [activeDays, setActiveDays] = useState<number[]>(editExpense?.activeDays || [1, 2, 3, 4, 5]);
  const [category, setCategory] = useState<FamilyTransactionCategory>(editExpense?.category || 'ulasim');
  const [icon, setIcon] = useState(editExpense?.icon || 'bus');
  const [notes, setNotes] = useState(editExpense?.notes || '');

  const toggleDay = (day: number) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const selectPreset = (preset: typeof RECURRING_EXPENSE_PRESETS[number]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setCategory(preset.category);
    setActiveDays(preset.defaultDays);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTurkishNumber(dailyAmount);
    if (!name.trim()) {
      toast({ title: t('transactions.form.nameRequired', { defaultValue: 'Ad zorunludur' }), variant: 'destructive' });
      return;
    }
    if (!parsed || parsed <= 0) {
      toast({ title: t('transactions.form.amountRequired', { defaultValue: 'Geçerli bir tutar giriniz' }), variant: 'destructive' });
      return;
    }
    if (activeDays.length === 0) {
      toast({ title: t('transactions.form.daysRequired', { defaultValue: 'En az bir gün seçiniz' }), variant: 'destructive' });
      return;
    }

    onSubmit({
      name: name.trim(),
      dailyAmount: parsed,
      currency: 'TRY' as CurrencyCode,
      activeDays,
      category,
      isActive: editExpense?.isActive ?? true,
      startDate: editExpense?.startDate || new Date().toISOString(),
      icon,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-lg font-bold">
        {editExpense ? t('incomeSection.dailyRecurring') : t('incomeSection.dailyRecurring')}
      </h3>

      {/* Presets */}
      {!editExpense && (
        <div>
          <Label className="mb-2 block">{t('incomeSection.systematic')}</Label>
          <div className="flex flex-wrap gap-2">
            {RECURRING_EXPENSE_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => selectPreset(p)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  name === p.name ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                }`}
              >
                <CategoryIcon name={p.icon} size={14} className="inline-block mr-1" />{p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>{t('transactions.form.description')}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('transactions.form.descriptionPlaceholder')} required />
      </div>

      <div>
        <Label>{t('transactions.form.amount')}</Label>
        <Input
          type="text"
          inputMode="decimal"
          value={dailyAmount}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
            setDailyAmount(cleaned);
          }}
          onBlur={() => {
            if (dailyAmount) {
              const parsed = parseTurkishNumber(dailyAmount);
              if (parsed > 0) setDailyAmount(formatNumber(parsed));
            }
          }}
          placeholder={t('transactions.form.amountPlaceholder')}
          required
        />
      </div>

      {/* Day Selector */}
      <div>
        <Label>{t('common:time.days')}</Label>
        <div className="mt-1 flex gap-1">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                activeDays.includes(idx)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {activeDays.length} {t('common:time.days')}
        </p>
      </div>

      <div>
        <Label>{t('transactions.form.category')}</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as FamilyTransactionCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((c) => (
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

      <Button type="submit" className="w-full">
        {editExpense ? t('common:actions.update') : t('common:actions.add')}
      </Button>
    </form>
  );
}
