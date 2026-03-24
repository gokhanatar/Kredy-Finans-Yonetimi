import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Shield } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PERSONAL_STORAGE_KEYS, FamilyTransaction, RecurringIncome } from '@/types/familyFinance';
import { CreditCard } from '@/types/finance';
import { formatCurrency } from '@/lib/financeUtils';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';

interface PersonalFinanceSummaryCardProps {
  compact?: boolean;
}

export function PersonalFinanceSummaryCard({ compact = false }: PersonalFinanceSummaryCardProps) {
  const { t } = useTranslation(['cards', 'common']);
  const navigate = useNavigate();
  const { formatAmount } = usePrivacyMode();

  const [cards] = useLocalStorage<CreditCard[]>('kredi-pusula-cards', []);
  const [transactions] = useLocalStorage<FamilyTransaction[]>(PERSONAL_STORAGE_KEYS.TRANSACTIONS, []);
  const [incomes] = useLocalStorage<RecurringIncome[]>(PERSONAL_STORAGE_KEYS.RECURRING_INCOMES, []);

  // Calculate totals from personal data
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthlyTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const monthlyIncome = monthlyTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = monthlyTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalDebt = cards.reduce((sum, c) => sum + c.currentDebt, 0);

  return (
    <button
      onClick={() => navigate('/wallet')}
      className={`w-full rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 ${compact ? 'p-3' : 'p-4'} text-left shadow-soft transition-transform active:scale-[0.98]`}
    >
      <div className={`flex items-center gap-3 ${compact ? 'mb-2' : 'mb-3'}`}>
        <div className={`flex items-center justify-center rounded-xl bg-blue-500/15 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
          <Shield className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-bold truncate`}>{t('summaryCard.personalTitle')}</p>
          {!compact && <p className="text-[10px] text-muted-foreground">{t('summaryCard.personalSubtitle')}</p>}
        </div>
        <span className="ml-auto text-muted-foreground text-sm shrink-0">→</span>
      </div>

      {compact ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between rounded-lg bg-card/60 px-2 py-1">
            <span className="flex items-center gap-1">
              <ArrowUpCircle className="h-3 w-3 text-green-500" />
              <span className="text-[10px] text-muted-foreground">{t('summaryCard.income')}</span>
            </span>
            <span className="text-[10px] font-bold text-green-600">{formatAmount(monthlyIncome)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-card/60 px-2 py-1">
            <span className="flex items-center gap-1">
              <ArrowDownCircle className="h-3 w-3 text-red-500" />
              <span className="text-[10px] text-muted-foreground">{t('summaryCard.expense')}</span>
            </span>
            <span className="text-[10px] font-bold text-red-600">{formatAmount(monthlyExpense)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-card/60 px-2 py-1">
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3 text-orange-500" />
              <span className="text-[10px] text-muted-foreground">{t('summaryCard.cardDebt')}</span>
            </span>
            <span className="text-[10px] font-bold text-orange-600">{formatAmount(totalDebt)}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card/60 p-2 text-center">
            <ArrowUpCircle className="mx-auto h-4 w-4 text-green-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{t('summaryCard.income')}</p>
            <p className="text-xs font-bold text-green-600">{formatAmount(monthlyIncome)}</p>
          </div>
          <div className="rounded-xl bg-card/60 p-2 text-center">
            <ArrowDownCircle className="mx-auto h-4 w-4 text-red-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{t('summaryCard.expense')}</p>
            <p className="text-xs font-bold text-red-600">{formatAmount(monthlyExpense)}</p>
          </div>
          <div className="rounded-xl bg-card/60 p-2 text-center">
            <Wallet className="mx-auto h-4 w-4 text-orange-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{t('summaryCard.cardDebt')}</p>
            <p className="text-xs font-bold text-orange-600">{formatAmount(totalDebt)}</p>
          </div>
        </div>
      )}
    </button>
  );
}
