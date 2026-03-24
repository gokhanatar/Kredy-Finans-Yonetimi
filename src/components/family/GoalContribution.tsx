import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';

interface GoalContributionProps {
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  onSubmit: (amount: number, note?: string) => void;
  onClose: () => void;
}

export function GoalContribution({
  goalName,
  currentAmount,
  targetAmount,
  onSubmit,
  onClose,
}: GoalContributionProps) {
  const { t } = useTranslation(['family', 'common']);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const { formatAmount } = usePrivacyMode();

  const remaining = targetAmount - currentAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTurkishNumber(amount);
    if (!parsed || parsed <= 0) return;
    onSubmit(parsed, note.trim() || undefined);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-lg font-bold">{t('goals.addMoney')}</h3>

      <div className="rounded-xl bg-primary/5 p-3 text-center">
        <Target className="mx-auto mb-1 h-6 w-6 text-primary" />
        <p className="text-sm font-medium">{goalName}</p>
        <p className="text-xs text-muted-foreground">
          {t('budget.remaining')}: {formatAmount(remaining)}
        </p>
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
          placeholder="0"
          required
          className="text-lg"
        />
      </div>

      <div className="flex gap-2">
        {[100, 500, 1000, 5000].map((v) => (
          <Button
            key={v}
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setAmount(formatNumber(v))}
          >
            {v.toLocaleString('tr-TR')}
          </Button>
        ))}
      </div>

      <div>
        <Label>{t('subscriptions.form.notes')}</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('subscriptions.form.notesPlaceholder')} />
      </div>

      <Button type="submit" className="w-full">
        {t('common:actions.add')}
      </Button>
    </form>
  );
}
