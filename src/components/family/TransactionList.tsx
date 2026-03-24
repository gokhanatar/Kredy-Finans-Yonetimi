import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FamilyTransaction,
  ALL_CATEGORIES,
  TransactionType,
} from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { Search, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TransactionListProps {
  transactions: FamilyTransaction[];
  onDelete: (id: string) => void;
  onEdit?: (tx: FamilyTransaction) => void;
}

export function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  const { t } = useTranslation(['family', 'common']);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const { formatAmount } = usePrivacyMode();

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(s) ||
          getCategoryLabel(t.category).toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [transactions, typeFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, FamilyTransaction[]>();
    filtered.forEach((t) => {
      const key = t.date.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('transactions.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType | 'all')}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common:all')}</SelectItem>
            <SelectItem value="income">{t('transactions.income')}</SelectItem>
            <SelectItem value="expense">{t('transactions.expense')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction Groups */}
      {grouped.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">{t('transactions.noTransactions')}</div>
      )}

      {grouped.map(([dateStr, txs]) => (
        <div key={dateStr}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {format(new Date(dateStr), 'd MMMM yyyy, EEEE', { locale: tr })}
          </p>
          <div className="space-y-1">
            {txs.map((tx) => {
              const cat = ALL_CATEGORIES.find((c) => c.id === tx.category);
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm"
                  onClick={() => onEdit?.(tx)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <CategoryIcon name={cat?.icon || 'package'} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description || cat?.label || t('transactions.defaultLabel')}
                    </p>
                    <p className="text-xs text-muted-foreground">{cat?.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatAmount(tx.amount)}
                    </span>
                    {tx.type === 'income' ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(tx.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function getCategoryLabel(id: string): string {
  return ALL_CATEGORIES.find((c) => c.id === id)?.label || id;
}
