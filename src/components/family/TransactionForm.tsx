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
import {
  FamilyTransaction,
  TransactionType,
  FamilyTransactionCategory,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  CurrencyCode,
} from '@/types/familyFinance';
import { CreditCard } from '@/types/finance';
import { Camera, ImagePlus, X, CreditCard as CardIcon } from 'lucide-react';
import { formatNumber, parseTurkishNumber } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { toast } from '@/hooks/use-toast';
import { ReceiptScanButton } from '@/components/ReceiptScanButton';
import type { ParsedReceipt } from '@/lib/receiptParser';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { cn } from '@/lib/utils';

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 9, 12];

interface TransactionFormProps {
  onSubmit: (data: Omit<FamilyTransaction, 'id'>) => void;
  onClose: () => void;
  editTransaction?: FamilyTransaction;
}

export function TransactionForm({ onSubmit, onClose, editTransaction }: TransactionFormProps) {
  const { t } = useTranslation(['family', 'common']);
  const [type, setType] = useState<TransactionType>(editTransaction?.type || 'expense');
  const [amount, setAmount] = useState(editTransaction?.amount ? formatNumber(editTransaction.amount) : '');
  const [category, setCategory] = useState<FamilyTransactionCategory>(
    editTransaction?.category || 'market'
  );
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [date, setDate] = useState(
    editTransaction?.date ? editTransaction.date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [currency] = useState<CurrencyCode>(editTransaction?.currency || 'TRY');
  const [receiptPhoto, setReceiptPhoto] = useState<string | undefined>(editTransaction?.receiptPhoto);

  // Optional card & installment (expense only)
  const [cards] = useFamilySyncedStorage<CreditCard[]>('kredi-pusula-cards', [] as CreditCard[]);
  const [selectedCardId, setSelectedCardId] = useState<string>(editTransaction?.cardId || '');
  const [installmentCount, setInstallmentCount] = useState<number>(editTransaction?.installments || 1);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseTurkishNumber(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ title: t('transactions.form.amountRequired', { defaultValue: 'Geçerli bir tutar giriniz' }), variant: 'destructive' });
      return;
    }

    onSubmit({
      type,
      amount: parsedAmount,
      category,
      description,
      date: new Date(date).toISOString(),
      currency,
      receiptPhoto,
      ...(type === 'expense' && selectedCardId ? { cardId: selectedCardId } : {}),
      ...(type === 'expense' && selectedCardId && installmentCount > 1 ? { installments: installmentCount } : {}),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-lg font-bold">
        {editTransaction ? t('transactions.editTransaction') : t('transactions.newTransaction')}
      </h3>

      {/* Type Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === 'income' ? 'default' : 'outline'}
          className={`flex-1 ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
          onClick={() => {
            setType('income');
            setCategory('maas');
          }}
        >
          {t('transactions.income')}
        </Button>
        <Button
          type="button"
          variant={type === 'expense' ? 'default' : 'outline'}
          className={`flex-1 ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
          onClick={() => {
            setType('expense');
            setCategory('market');
          }}
        >
          {t('transactions.expense')}
        </Button>
      </div>

      {/* Amount */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>{t('transactions.form.amount')}</Label>
          {type === 'expense' && (
            <ReceiptScanButton
              compact
              onResult={(receipt: ParsedReceipt) => {
                if (receipt.total) setAmount(formatNumber(receipt.total));
                if (receipt.merchant) setDescription(receipt.merchant);
                if (receipt.category) setCategory(receipt.category as FamilyTransactionCategory);
              }}
            />
          )}
        </div>
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
          placeholder={t('transactions.form.amountPlaceholder')}
          required
          className="text-lg"
        />
      </div>

      {/* Category */}
      <div>
        <Label>{t('transactions.form.category')}</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as FamilyTransactionCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <CategoryIcon name={c.icon} size={16} className="inline-block mr-1" />{c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div>
        <Label>{t('transactions.form.description')}</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('transactions.form.descriptionPlaceholder')}
        />
      </div>

      {/* Date */}
      <div>
        <Label>{t('transactions.form.date')}</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      {/* Card Selection (expense only, optional) */}
      {type === 'expense' && cards.length > 0 && (
        <div>
          <Label className="flex items-center gap-1.5">
            <CardIcon className="h-3.5 w-3.5 text-muted-foreground" />
            {t('transactions.form.card', { defaultValue: 'Kartla Ödeme (opsiyonel)' })}
          </Label>
          <Select value={selectedCardId || 'none'} onValueChange={(v) => { setSelectedCardId(v === 'none' ? '' : v); if (v === 'none') setInstallmentCount(1); }}>
            <SelectTrigger>
              <SelectValue placeholder={t('transactions.form.cardPlaceholder', { defaultValue: 'Nakit / Seçilmedi' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t('transactions.form.noCard', { defaultValue: 'Nakit / Seçilmedi' })}
              </SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  <span className="flex items-center gap-2">
                    <span className={cn("inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br", card.color)} />
                    {card.bankName} — {card.cardName} (•••• {card.lastFourDigits})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Installment Count (only when card selected) */}
      {type === 'expense' && selectedCardId && selectedCardId !== 'none' && (
        <div>
          <Label>{t('transactions.form.installments', { defaultValue: 'Taksit Sayısı' })}</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {INSTALLMENT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setInstallmentCount(n)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors border",
                  installmentCount === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 text-foreground border-transparent hover:bg-secondary"
                )}
              >
                {n === 1 ? t('transactions.form.singlePayment', { defaultValue: 'Tek Çekim' }) : `${n} ${t('transactions.form.installmentSuffix', { defaultValue: 'Taksit' })}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Receipt Photo */}
      <div>
        <Label>{t('transactions.form.receipt')}</Label>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 hover:bg-secondary/50">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t('transactions.form.takePhoto', 'Çek')}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 hover:bg-secondary/50">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t('transactions.form.choosePhoto', 'Galeri')}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoCapture}
            />
          </label>
          {receiptPhoto && (
            <div className="relative">
              <img src={receiptPhoto} alt={t('transactions.receipt')} className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setReceiptPhoto(undefined)}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full">
        {editTransaction ? t('common:actions.update') : t('common:actions.add')}
      </Button>
    </form>
  );
}
