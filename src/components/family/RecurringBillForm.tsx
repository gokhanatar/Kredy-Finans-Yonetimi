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
import { Switch } from '@/components/ui/switch';
import { CategoryIcon } from '@/components/ui/category-icon';
import {
  RecurringBill,
  BillFrequency,
  FamilyTransactionCategory,
  EXPENSE_CATEGORIES,
  RECURRING_BILL_PRESETS,
  DAY_LABELS,
  CurrencyCode,
} from '@/types/familyFinance';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { toast } from '@/hooks/use-toast';


interface RecurringBillFormProps {
  onSubmit: (data: Omit<RecurringBill, 'id'>) => void;
  onClose: () => void;
  editBill?: RecurringBill;
}

export function RecurringBillForm({ onSubmit, onClose, editBill }: RecurringBillFormProps) {
  const { t } = useTranslation(['family', 'finance', 'common']);
  const [name, setName] = useState(editBill?.name || '');
  const [frequency, setFrequency] = useState<BillFrequency>(editBill?.frequency || 'monthly');
  const [dayOfMonth, setDayOfMonth] = useState(editBill?.dayOfMonth?.toString() || '1');
  const [dayOfWeek, setDayOfWeek] = useState(editBill?.dayOfWeek?.toString() || '1');
  const [isFixedAmount, setIsFixedAmount] = useState(editBill?.isFixedAmount ?? true);
  const [amount, setAmount] = useState(editBill?.fixedAmount ? formatNumber(editBill.fixedAmount) : '');
  const [category, setCategory] = useState<FamilyTransactionCategory>(editBill?.category || 'fatura');
  const [currency, setCurrency] = useState<CurrencyCode>(editBill?.currency || 'TRY');
  const [icon, setIcon] = useState(editBill?.icon || 'file-text');
  const [notes, setNotes] = useState(editBill?.notes || '');

  const selectPreset = (preset: typeof RECURRING_BILL_PRESETS[number]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setCategory(preset.category);
    setIsFixedAmount(preset.isFixed);
    setFrequency(preset.frequency);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: t('bills.nameRequired', { defaultValue: 'Fatura adı zorunludur' }), variant: 'destructive' });
      return;
    }

    const parsedAmount = isFixedAmount ? parseTurkishNumber(amount) : 0;
    if (isFixedAmount && (!parsedAmount || parsedAmount <= 0)) {
      toast({ title: t('bills.amountRequired', { defaultValue: 'Geçerli bir tutar giriniz' }), variant: 'destructive' });
      return;
    }

    onSubmit({
      name: name.trim(),
      frequency,
      dayOfMonth: frequency === 'monthly' ? (parseInt(dayOfMonth) || 1) : undefined,
      dayOfWeek: frequency === 'weekly' ? (parseInt(dayOfWeek) || 1) : undefined,
      isFixedAmount,
      fixedAmount: isFixedAmount ? parsedAmount : undefined,
      lastPaidAmount: editBill?.lastPaidAmount,
      category,
      currency,
      isActive: editBill?.isActive ?? true,
      icon,
      notes: notes.trim() || undefined,
      history: editBill?.history || [],
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-lg font-bold">
        {editBill ? t('bills.editBill', 'Faturay\u0131 D\u00fczenle') : t('bills.newBill', 'Yeni Fatura')}
      </h3>

      {/* Presets */}
      {!editBill && (
        <div>
          <Label className="mb-2 block">{t('bills.presets', 'Haz\u0131r \u015eablonlar')}</Label>
          <div className="flex flex-wrap gap-2">
            {RECURRING_BILL_PRESETS.map((p) => (
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

      {/* Name */}
      <div>
        <Label>{t('subscriptions.form.name', 'Ad')}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('bills.namePlaceholder', 'Fatura ad\u0131')}
          required
        />
      </div>

      {/* Frequency - segmented control */}
      <div>
        <Label>{t('bills.frequency', 'Tekrar S\u0131kl\u0131\u011f\u0131')}</Label>
        <div className="mt-1 flex gap-1">
          {(['daily', 'weekly', 'monthly'] as BillFrequency[]).map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                frequency === freq
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {freq === 'daily' && t('bills.daily', 'G\u00fcnl\u00fck')}
              {freq === 'weekly' && t('bills.weekly', 'Haftal\u0131k')}
              {freq === 'monthly' && t('bills.monthly', 'Ayl\u0131k')}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional: Day of Month (monthly) */}
      {frequency === 'monthly' && (
        <div>
          <Label>{t('bills.dayOfMonth', 'Ay\u0131n G\u00fcn\u00fc')}</Label>
          <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conditional: Day of Week (weekly) */}
      {frequency === 'weekly' && (
        <div>
          <Label>{t('bills.dayOfWeek', 'Haftan\u0131n G\u00fcn\u00fc')}</Label>
          <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_LABELS.map((label, idx) => (
                <SelectItem key={idx} value={idx.toString()}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Fixed Amount Toggle */}
      <div className="flex items-center justify-between">
        <Label>{t('bills.fixedAmount', 'Sabit Tutar')}</Label>
        <Switch checked={isFixedAmount} onCheckedChange={setIsFixedAmount} />
      </div>

      {/* Amount (only if fixed) */}
      {isFixedAmount && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t('transactions.form.amount', 'Tutar')}</Label>
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
              placeholder="0"
              required
            />
          </div>
          <div>
            <Label>{t('subscriptions.form.currency', 'Para Birimi')}</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">&#8378; TRY</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="EUR">&euro; EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Category */}
      <div>
        <Label>{t('transactions.form.category', 'Kategori')}</Label>
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

      {/* Notes */}
      <div>
        <Label>{t('subscriptions.form.notes', 'Notlar')}</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('subscriptions.form.notesPlaceholder', 'Opsiyonel not')}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full">
        {editBill ? t('common:actions.update', 'G\u00fcncelle') : t('common:actions.add', 'Ekle')}
      </Button>
    </form>
  );
}
