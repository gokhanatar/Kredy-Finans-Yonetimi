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
  Subscription,
  BillingCycle,
  SubscriptionCategory,
  SUBSCRIPTION_CATEGORIES,
  POPULAR_SUBSCRIPTIONS,
  CurrencyCode,
} from '@/types/familyFinance';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { toast } from '@/hooks/use-toast';


interface SubscriptionFormProps {
  onSubmit: (data: Omit<Subscription, 'id'>) => void;
  onClose: () => void;
  editSubscription?: Subscription;
}

export function SubscriptionForm({ onSubmit, onClose, editSubscription }: SubscriptionFormProps) {
  const { t } = useTranslation(['family', 'finance', 'common']);
  const [name, setName] = useState(editSubscription?.name || '');
  const [amount, setAmount] = useState(editSubscription?.amount ? formatNumber(editSubscription.amount) : '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(editSubscription?.billingCycle || 'monthly');
  const [billingDate, setBillingDate] = useState(editSubscription?.billingDate?.toString() || '1');
  const [category, setCategory] = useState<SubscriptionCategory>(editSubscription?.category || 'dijital');
  const [currency, setCurrency] = useState<CurrencyCode>(editSubscription?.currency || 'TRY');
  const [icon, setIcon] = useState(editSubscription?.icon || 'smartphone');
  const [notes, setNotes] = useState(editSubscription?.notes || '');

  const selectPreset = (preset: typeof POPULAR_SUBSCRIPTIONS[number]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setCategory(preset.category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseTurkishNumber(amount);
    if (!name.trim()) {
      toast({ title: t('subscriptions.form.nameRequired', { defaultValue: 'Abonelik adı zorunludur' }), variant: 'destructive' });
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: t('subscriptions.form.amountRequired', { defaultValue: 'Geçerli bir tutar giriniz' }), variant: 'destructive' });
      return;
    }

    onSubmit({
      name: name.trim(),
      amount: parsedAmount,
      currency,
      billingCycle,
      billingDate: parseInt(billingDate) || 1,
      category,
      isActive: editSubscription?.isActive ?? true,
      icon,
      startDate: editSubscription?.startDate || new Date().toISOString(),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-lg font-bold">
        {editSubscription ? t('subscriptions.editSubscription') : t('subscriptions.newSubscription')}
      </h3>

      {/* Popular Presets */}
      {!editSubscription && (
        <div>
          <Label className="mb-2 block">{t('subscriptions.popularServices')}</Label>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SUBSCRIPTIONS.map((p) => (
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
        <Label>{t('subscriptions.form.name')}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('subscriptions.form.namePlaceholder')} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('subscriptions.form.amount')}</Label>
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
          <Label>{t('subscriptions.form.currency')}</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRY">₺ TRY</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
              <SelectItem value="EUR">€ EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('subscriptions.form.cycle')}</Label>
          <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">{t('subscriptions.cycles.weekly')}</SelectItem>
              <SelectItem value="monthly">{t('subscriptions.cycles.monthly')}</SelectItem>
              <SelectItem value="yearly">{t('subscriptions.cycles.yearly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('subscriptions.form.billingDate')}</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={billingDate}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              const num = parseInt(val, 10);
              if (val === '' || (num >= 1 && num <= 31)) {
                setBillingDate(val);
              }
            }}
          />
        </div>
      </div>

      <div>
        <Label>{t('subscriptions.form.category')}</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as SubscriptionCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBSCRIPTION_CATEGORIES.map((c) => (
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
        {editSubscription ? t('common:actions.update') : t('common:actions.add')}
      </Button>
    </form>
  );
}
