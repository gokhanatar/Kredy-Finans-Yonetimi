import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Goal, GOAL_ICONS, GOAL_COLORS, CurrencyCode } from '@/types/familyFinance';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { toast } from '@/hooks/use-toast';


interface GoalFormProps {
  onSubmit: (data: Omit<Goal, 'id' | 'contributions' | 'currentAmount'>) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  editGoal?: Goal;
}

export function GoalForm({ onSubmit, onClose, onDelete, editGoal }: GoalFormProps) {
  const { t } = useTranslation(['family', 'common']);
  const [name, setName] = useState(editGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(editGoal?.targetAmount ? formatNumber(editGoal.targetAmount) : '');
  const [deadline, setDeadline] = useState(editGoal?.deadline?.split('T')[0] || '');
  const [icon, setIcon] = useState(editGoal?.icon || GOAL_ICONS[0]);
  const [color, setColor] = useState(editGoal?.color || GOAL_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseTurkishNumber(targetAmount);
    if (!name.trim()) {
      toast({ title: t('goals.form.nameRequired', { defaultValue: 'Hedef adı zorunludur' }), variant: 'destructive' });
      return;
    }
    if (!target || target <= 0) {
      toast({ title: t('goals.form.amountRequired', { defaultValue: 'Geçerli bir hedef tutar giriniz' }), variant: 'destructive' });
      return;
    }

    onSubmit({
      name: name.trim(),
      targetAmount: target,
      currency: 'TRY' as CurrencyCode,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      icon,
      color,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-lg font-bold">{editGoal ? t('goals.editGoal') : t('goals.newGoal')}</h3>

      <div>
        <Label>{t('goals.form.name')}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('goals.form.namePlaceholder')} required />
      </div>

      <div>
        <Label>{t('goals.form.targetAmount')}</Label>
        <Input
          type="text"
          inputMode="decimal"
          value={targetAmount}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
            setTargetAmount(cleaned);
          }}
          onBlur={() => {
            if (targetAmount) {
              const parsed = parseTurkishNumber(targetAmount);
              if (parsed > 0) setTargetAmount(formatNumber(parsed));
            }
          }}
          placeholder={t('goals.form.targetPlaceholder')}
          required
        />
      </div>

      <div>
        <Label>{t('goals.form.deadline')}</Label>
        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>

      <div>
        <Label>{t('goals.form.icon')}</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {GOAL_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors ${
                icon === i ? 'bg-primary/10 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <CategoryIcon name={i} size={20} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t('goals.form.color')}</Label>
        <div className="mt-1 flex gap-2">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full bg-gradient-to-br ${c} ${
                color === c ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        {editGoal ? t('common:actions.update') : t('common:actions.create')}
      </Button>

      {editGoal && onDelete && (
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={() => {
            onDelete(editGoal.id);
            onClose();
          }}
        >
          {t('goals.deleteGoal')}
        </Button>
      )}
    </form>
  );
}
