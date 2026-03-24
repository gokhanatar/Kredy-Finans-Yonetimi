import { useTranslation } from 'react-i18next';
import { InstallmentCard } from './InstallmentCard';
import type { CardInstallment } from '@/types/finance';

interface InstallmentListProps {
  installments: CardInstallment[];
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InstallmentList({ installments, onMarkPaid, onDelete }: InstallmentListProps) {
  const { t } = useTranslation(['cards']);

  if (installments.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">
        {t('cards:installments.activeTitle')} ({installments.length})
      </h4>
      <div className="space-y-2">
        {installments.map((inst) => (
          <InstallmentCard
            key={inst.id}
            installment={inst}
            onMarkPaid={onMarkPaid}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
