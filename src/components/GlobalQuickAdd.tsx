import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { TransactionForm } from '@/components/family/TransactionForm';
import { useTransactions } from '@/hooks/useTransactions';
import { PERSONAL_STORAGE_KEYS, FAMILY_STORAGE_KEYS } from '@/types/familyFinance';
import { useFamilySync } from '@/contexts/FamilySyncContext';
import { toast } from '@/hooks/use-toast';

interface GlobalQuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalQuickAdd({ open, onOpenChange }: GlobalQuickAddProps) {
  const { t } = useTranslation(['family', 'common']);
  const { familyId } = useFamilySync();
  const [scope, setScope] = useState<'personal' | 'family'>('personal');

  const keys = scope === 'personal' ? PERSONAL_STORAGE_KEYS : FAMILY_STORAGE_KEYS;
  const txHook = useTransactions(keys.TRANSACTIONS, scope);

  const handleSubmit = (data: Parameters<typeof txHook.addTransaction>[0]) => {
    txHook.addTransaction(data);
    toast({
      title: data.type === 'income'
        ? t('transactions.incomeAdded')
        : t('transactions.expenseAdded'),
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <SheetTitle>{t('transactions.title', 'İşlem Ekle')}</SheetTitle>
        </VisuallyHidden>

        <div className="overflow-y-auto max-h-[85vh]">
          {/* Family scope toggle */}
          {familyId && (
            <div className="flex gap-1 rounded-lg bg-secondary p-1 mx-4 mt-4">
              <button
                onClick={() => setScope('personal')}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  scope === 'personal' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {t('common:nav.wallet', 'Kişisel')}
              </button>
              <button
                onClick={() => setScope('family')}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  scope === 'family' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {t('common:nav.family', 'Aile')}
              </button>
            </div>
          )}

          <TransactionForm
            onSubmit={handleSubmit}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
