import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SharedWallet, SharedTransaction, SplitType } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
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
import { Plus, Trash2, ArrowLeft, Users } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SharedWalletDetailProps {
  wallet: SharedWallet;
  balances: Record<string, number>;
  totalSpent: number;
  onAddTransaction: (walletId: string, data: Omit<SharedTransaction, 'id' | 'walletId'>) => void;
  onDeleteTransaction: (walletId: string, txId: string) => void;
  onBack: () => void;
}

export function SharedWalletDetail({
  wallet,
  balances,
  totalSpent,
  onAddTransaction,
  onDeleteTransaction,
  onBack,
}: SharedWalletDetailProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount } = usePrivacyMode();
  const [showForm, setShowForm] = useState(false);
  const [paidBy, setPaidBy] = useState(wallet.members[0] || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitType] = useState<SplitType>('equal');

  const handleAdd = () => {
    const parsed = parseTurkishNumber(amount);
    if (!parsed || parsed <= 0 || !description.trim()) return;

    onAddTransaction(wallet.id, {
      paidBy,
      amount: parsed,
      description: description.trim(),
      date: new Date().toISOString(),
      splitType,
    });

    setAmount('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <CategoryIcon name={wallet.icon} size={24} />
        <div>
          <h3 className="font-bold">{wallet.name}</h3>
          <p className="text-xs text-muted-foreground">{t('sharedWallets.memberCount', { count: wallet.members.length })}</p>
        </div>
      </div>

      {/* Balances */}
      <div className="rounded-xl bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-semibold">{t('accounts.totalBalance')}</span>
        </div>
        <div className="space-y-1">
          {wallet.members.map((member) => {
            const balance = balances[member] || 0;
            return (
              <div key={member} className="flex justify-between text-sm">
                <span>{member}</span>
                <span className={balance >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {balance >= 0 ? '+' : ''}{formatAmount(balance)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 border-t pt-2 flex justify-between text-xs text-muted-foreground">
          <span>{t('common:total')}</span>
          <span>{formatAmount(totalSpent)}</span>
        </div>
      </div>

      {/* Add Transaction */}
      {showForm ? (
        <div className="rounded-xl bg-card p-3 shadow-sm space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t('common:actions.send')}</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wallet.members.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t('transactions.form.amount')}</Label>
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
                className="h-8"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t('transactions.form.description')}</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8" placeholder={t('transactions.form.descriptionPlaceholder')} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={handleAdd}>{t('common:actions.add')}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{t('common:actions.cancel')}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          {t('common:actions.add')}
        </Button>
      )}

      {/* Transaction List */}
      <div className="space-y-1">
        {wallet.transactions
          .slice()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 rounded-lg bg-card p-2 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.paidBy} • {format(new Date(tx.date), 'd MMM', { locale: tr })}
                </p>
              </div>
              <span className="text-sm font-medium">{formatAmount(tx.amount)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDeleteTransaction(wallet.id, tx.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
      </div>

      {wallet.transactions.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">{t('transactions.noTransactions')}</p>
      )}
    </div>
  );
}
