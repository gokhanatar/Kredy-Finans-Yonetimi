import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SharedWallet, CurrencyCode } from '@/types/familyFinance';
import { Plus, Trash2 } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';
import { toast } from '@/hooks/use-toast';

interface SharedWalletFormProps {
  onSubmit: (data: Omit<SharedWallet, 'id' | 'transactions'>) => void;
  onClose: () => void;
  editWallet?: SharedWallet;
}

export function SharedWalletForm({ onSubmit, onClose, editWallet }: SharedWalletFormProps) {
  const { t } = useTranslation(['family', 'common']);
  const [name, setName] = useState(editWallet?.name || '');
  const [members, setMembers] = useState<string[]>(editWallet?.members || ['']);
  const [icon, setIcon] = useState(editWallet?.icon || 'user-round');

  const addMember = () => setMembers((prev) => [...prev, '']);
  const removeMember = (idx: number) => setMembers((prev) => prev.filter((_, i) => i !== idx));
  const updateMember = (idx: number, value: string) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? value : m)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMembers = members.map((m) => m.trim()).filter(Boolean);
    if (!name.trim()) {
      toast({ title: t('sharedWallets.nameRequired', { defaultValue: 'Cüzdan adı zorunludur' }), variant: 'destructive' });
      return;
    }
    if (validMembers.length < 2) {
      toast({ title: t('sharedWallets.membersRequired', { defaultValue: 'En az 2 üye gereklidir' }), variant: 'destructive' });
      return;
    }

    onSubmit({
      name: name.trim(),
      members: validMembers,
      currency: 'TRY' as CurrencyCode,
      icon,
    });
    onClose();
  };

  const walletIcons = ['user-round', 'home', 'building-2', 'gift', 'utensils-crossed', 'plane', 'shopping-cart', 'star'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-lg font-bold">{editWallet ? t('common:actions.edit') : t('sharedWallets.title')}</h3>

      <div>
        <Label>{t('goals.form.icon')}</Label>
        <div className="mt-1 flex gap-2">
          {walletIcons.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${
                icon === i ? 'bg-primary/10 ring-2 ring-primary' : 'bg-secondary'
              }`}
            >
              <CategoryIcon name={i} size={20} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t('accounts.form.name')}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('accounts.form.namePlaceholder')} required />
      </div>

      <div>
        <Label>{t('sync.members')}</Label>
        <div className="space-y-2 mt-1">
          {members.map((member, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={member}
                onChange={(e) => updateMember(idx, e.target.value)}
                placeholder={t('sharedWallets.memberPlaceholder', { number: idx + 1 })}
              />
              {members.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addMember}>
            <Plus className="h-4 w-4" />
            {t('common:actions.add')}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {editWallet ? t('common:actions.update') : t('common:actions.create')}
      </Button>
    </form>
  );
}
