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
import { Account, AccountType, CurrencyCode } from '@/types/familyFinance';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { toast } from '@/hooks/use-toast';


const ACCOUNT_TYPES: { id: AccountType; labelKey: string; icon: string }[] = [
  { id: 'bank', labelKey: 'accounts.types.bank', icon: 'landmark' },
  { id: 'cash', labelKey: 'accounts.types.cash', icon: 'banknote' },
  { id: 'digital', labelKey: 'accounts.types.digital', icon: 'smartphone' },
  { id: 'investment', labelKey: 'accounts.types.investment', icon: 'trending-up' },
];

const ACCOUNT_COLORS = [
  'from-blue-500 to-blue-700',
  'from-green-500 to-green-700',
  'from-purple-500 to-purple-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-teal-500 to-teal-700',
];

interface AccountFormProps {
  onSubmit: (data: Omit<Account, 'id'>) => void;
  onClose: () => void;
  editAccount?: Account;
}

export function AccountForm({ onSubmit, onClose, editAccount }: AccountFormProps) {
  const { t } = useTranslation(['family', 'common']);
  const [name, setName] = useState(editAccount?.name || '');
  const [type, setType] = useState<AccountType>(editAccount?.type || 'bank');
  const [balance, setBalance] = useState(editAccount?.balance ? formatNumber(editAccount.balance) : '0');
  const [currency, setCurrency] = useState<CurrencyCode>(editAccount?.currency || 'TRY');
  const [bankName, setBankName] = useState(editAccount?.bankName || '');
  const [color, setColor] = useState(editAccount?.color || ACCOUNT_COLORS[0]);

  const selectedType = ACCOUNT_TYPES.find((t) => t.id === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: t('accounts.form.nameRequired', { defaultValue: 'Hesap adı zorunludur' }), variant: 'destructive' });
      return;
    }

    onSubmit({
      name: name.trim(),
      type,
      balance: parseTurkishNumber(balance) || 0,
      currency,
      icon: selectedType?.icon || 'landmark',
      color,
      bankName: bankName.trim() || undefined,
      isActive: true,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-lg font-bold">
        {editAccount ? t('accounts.editAccount') : t('accounts.newAccount')}
      </h3>

      <div>
        <Label>{t('accounts.form.type')}</Label>
        <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((at) => (
              <SelectItem key={at.id} value={at.id}>
                <CategoryIcon name={at.icon} size={16} className="inline-block mr-1" />{t(at.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t('accounts.form.name')}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('accounts.form.namePlaceholder')} required />
      </div>

      {type === 'bank' && (
        <div>
          <Label>{t('accounts.form.bankName')}</Label>
          <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={t('accounts.form.bankNamePlaceholder')} />
        </div>
      )}

      <div>
        <Label>{t('accounts.form.balance')}</Label>
        <Input
          type="text"
          inputMode="decimal"
          value={balance}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
            setBalance(cleaned);
          }}
          onBlur={() => {
            if (balance) {
              const parsed = parseTurkishNumber(balance);
              if (parsed >= 0) setBalance(formatNumber(parsed));
            }
          }}
        />
      </div>

      <div>
        <Label>{t('accounts.form.currency')}</Label>
        <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRY">{t('accounts.currencyOptions.TRY')}</SelectItem>
            <SelectItem value="USD">{t('accounts.currencyOptions.USD')}</SelectItem>
            <SelectItem value="EUR">{t('accounts.currencyOptions.EUR')}</SelectItem>
            <SelectItem value="GBP">{t('accounts.currencyOptions.GBP')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t('accounts.form.color')}</Label>
        <div className="flex gap-2 mt-1">
          {ACCOUNT_COLORS.map((c) => (
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
        {editAccount ? t('common:actions.update') : t('common:actions.add')}
      </Button>
    </form>
  );
}
