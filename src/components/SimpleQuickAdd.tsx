import { useState, useRef, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { FamilyTransaction, FamilyTransactionCategory, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/familyFinance';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { parseTurkishNumber } from '@/lib/financeUtils';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingCart, Fuel, UtensilsCrossed, Zap, Bus,
  Wallet, Banknote, Home, TrendingUp, Gem, Package,
} from 'lucide-react';

const POPULAR_EXPENSE_CATEGORIES: { id: FamilyTransactionCategory; label: string; icon: typeof ShoppingCart }[] = [
  { id: 'market', label: 'Market', icon: ShoppingCart },
  { id: 'tasit', label: 'Yakıt', icon: Fuel },
  { id: 'yemek', label: 'Yemek', icon: UtensilsCrossed },
  { id: 'fatura', label: 'Fatura', icon: Zap },
  { id: 'ulasim', label: 'Ulaşım', icon: Bus },
];

const POPULAR_INCOME_CATEGORIES: { id: FamilyTransactionCategory; label: string; icon: typeof Wallet }[] = [
  { id: 'maas', label: 'Maaş', icon: Wallet },
  { id: 'ek-gelir', label: 'Ek Gelir', icon: Banknote },
  { id: 'kira-gelir', label: 'Kira', icon: Home },
  { id: 'yatirim-gelir', label: 'Yatırım', icon: TrendingUp },
  { id: 'diger-gelir', label: 'Diğer', icon: Gem },
];

interface SimpleQuickAddProps {
  open: boolean;
  onClose: () => void;
  scope?: 'personal' | 'family';
  defaultType?: 'income' | 'expense';
}

export function SimpleQuickAdd({ open, onClose, scope = 'personal', defaultType }: SimpleQuickAddProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<FamilyTransactionCategory | null>(null);
  const [note, setNote] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const storageKey = scope === 'family' ? 'kredi-pusula-family-transactions' : 'kredi-pusula-personal-transactions';
  const { addTransaction } = useTransactions(storageKey, scope);
  const { addEntry } = useTransactionHistory();

  // Sync type when sheet opens with a defaultType
  useEffect(() => {
    if (open && defaultType) {
      setType(defaultType);
      setCategory(null);
      setShowAllCategories(false);
    }
  }, [open, defaultType]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const popularCategories = type === 'expense' ? POPULAR_EXPENSE_CATEGORIES : POPULAR_INCOME_CATEGORIES;
  const allCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSave = () => {
    const parsed = parseTurkishNumber(amount);
    if (!parsed || parsed <= 0) {
      toast({ title: 'Lütfen geçerli bir tutar girin', variant: 'destructive' });
      return;
    }
    if (!category) {
      toast({ title: 'Lütfen bir kategori seçin', variant: 'destructive' });
      return;
    }

    const categoryLabel = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(c => c.id === category)?.label || '';

    const tx: Omit<FamilyTransaction, 'id'> = {
      type,
      amount: parsed,
      category,
      description: note || categoryLabel,
      date: new Date().toISOString(),
      currency: 'TRY',
    };

    addTransaction(tx);
    addEntry({
      type: type === 'income' ? 'income' : 'expense',
      title: note || categoryLabel,
      amount: parsed,
      category: category,
      date: new Date().toISOString(),
    });

    toast({ title: `${type === 'income' ? 'Gelir' : 'Gider'} eklendi` });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setAmount('');
    setCategory(null);
    setNote('');
    setShowAllCategories(false);
    setType('expense');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
      onClose();
    }
  };

  const isIncome = type === 'income';

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left px-5 pb-2">
          <DrawerTitle className="text-lg font-bold">Yeni İşlem Ekle</DrawerTitle>
        </DrawerHeader>

        <div className="px-5 pb-8 space-y-4 overflow-y-auto">
          {/* Type Toggle */}
          <div className="flex rounded-xl bg-muted p-1">
            <button
              onClick={() => { setType('income'); setCategory(null); setShowAllCategories(false); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                isIncome ? 'bg-success text-white shadow-sm' : 'text-muted-foreground'
              }`}
            >
              GELİR
            </button>
            <button
              onClick={() => { setType('expense'); setCategory(null); setShowAllCategories(false); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                !isIncome ? 'bg-destructive text-white shadow-sm' : 'text-muted-foreground'
              }`}
            >
              GİDER
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tutar</label>
            <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground/40"
              />
              <span className="text-lg font-medium text-muted-foreground">₺</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {(showAllCategories ? allCategories : popularCategories).map((cat) => {
                const isSelected = category === cat.id;
                const IconComp = ('icon' in cat && typeof cat.icon !== 'string') ? cat.icon : Package;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                    {cat.label}
                  </button>
                );
              })}
              {!showAllCategories && (
                <button
                  onClick={() => setShowAllCategories(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80"
                >
                  <Package className="h-4 w-4" /> Diğer...
                </button>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Not (opsiyonel)</label>
            <input
              type="text"
              placeholder="Açıklama ekle..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Save Button — dynamic color */}
          <button
            onClick={handleSave}
            className={`w-full py-3.5 rounded-xl font-bold text-base text-white shadow-lg transition-all active:scale-[0.98] ${
              isIncome
                ? 'bg-gradient-to-r from-success to-emerald-600 shadow-success/25'
                : 'bg-gradient-to-r from-destructive to-red-600 shadow-destructive/25'
            }`}
          >
            {isIncome ? 'Gelir Kaydet' : 'Gider Kaydet'}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
