import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Investment, InvestmentCategory, INVESTMENT_CATEGORY_LABEL_KEYS, INVESTMENT_CATEGORY_EMOJIS } from '@/types/investment';
import { InvestmentCard } from './InvestmentCard';

interface InvestmentListProps {
  investments: Investment[];
  category: InvestmentCategory;
  onAdd: () => void;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

export function InvestmentList({ investments, category, onAdd, onEdit, onDelete }: InvestmentListProps) {
  const { t } = useTranslation(['investments', 'common']);

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/30 py-12">
        <span className="text-4xl mb-3">{INVESTMENT_CATEGORY_EMOJIS[category]}</span>
        <p className="text-muted-foreground text-sm">
          {t('portfolio.noInvestmentCategory', { category: t(INVESTMENT_CATEGORY_LABEL_KEYS[category]).toLowerCase() })}
        </p>
        <Button onClick={onAdd} variant="link" className="mt-2">
          {t('portfolio.addFirstInvestment')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('portfolio.investmentCount', { count: investments.length })}
        </p>
        <Button onClick={onAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('common:actions.add')}
        </Button>
      </div>
      {investments.map((inv) => (
        <InvestmentCard
          key={inv.id}
          investment={inv}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
