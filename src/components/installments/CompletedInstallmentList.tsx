import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InstallmentCard } from './InstallmentCard';
import type { CardInstallment } from '@/types/finance';

interface CompletedInstallmentListProps {
  installments: CardInstallment[];
  onDelete: (id: string) => void;
}

export function CompletedInstallmentList({ installments, onDelete }: CompletedInstallmentListProps) {
  const { t } = useTranslation(['cards']);

  if (installments.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
        <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
        {t('cards:installments.completedTitle')} ({installments.length})
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-2">
          {installments.map((inst) => (
            <InstallmentCard
              key={inst.id}
              installment={inst}
              onMarkPaid={() => {}}
              onDelete={onDelete}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
