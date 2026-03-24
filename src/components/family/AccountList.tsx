import { useTranslation } from 'react-i18next';
import { Account } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';
import { BankAccountCard } from '@/components/BankAccountCard';
import { formatCurrency } from '@/lib/financeUtils';

interface AccountListProps {
  accounts: Account[];
  onAdd: () => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountList({ accounts, onAdd, onEdit, onDelete }: AccountListProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount, isPrivate } = usePrivacyMode();

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const kmhAccounts = accounts.filter((a) => a.type === 'bank' && a.kmhEnabled && a.balance < 0);
  const totalKMHUsed = kmhAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);

  return (
    <div className="space-y-3">
      {/* Total */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-4">
        <p className="text-xs text-muted-foreground">{t('accounts.totalBalance')}</p>
        <p className="text-2xl font-bold">{formatAmount(totalBalance)}</p>
      </div>

      {/* KMH Summary Banner */}
      {kmhAccounts.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t('accounts.kmh.summaryBanner', {
              defaultValue: '{{count}} hesapta KMH kullanımı: {{amount}}',
              count: kmhAccounts.length,
              amount: isPrivate ? '***' : formatCurrency(totalKMHUsed),
            })}
          </p>
        </div>
      )}

      {/* Account Cards */}
      {accounts.map((account) => {
        // Bank accounts with KMH use BankAccountCard
        if (account.type === 'bank' && account.kmhEnabled) {
          return (
            <BankAccountCard
              key={account.id}
              account={account}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        }

        // Standard account card
        return (
          <div
            key={account.id}
            className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${account.color} text-lg`}
            >
              <CategoryIcon name={account.icon} size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{account.name}</p>
              <p className="text-xs text-muted-foreground">
                {account.bankName || account.type === 'bank' ? t('accounts.typeShort.bank') : account.type === 'cash' ? t('accounts.typeShort.cash') : account.type === 'digital' ? t('accounts.typeShort.digital') : t('accounts.typeShort.investment')}
              </p>
            </div>
            <span className={`text-sm font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(account.balance)}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(account)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDelete(account.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}

      {accounts.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {t('accounts.noAccounts')}
        </div>
      )}

      <Button variant="outline" className="w-full gap-2" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {t('accounts.addAccount')}
      </Button>
    </div>
  );
}
