import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, ArrowUpCircle, ArrowDownCircle, UserPlus } from 'lucide-react';
import { useFamilySyncedStorage } from '@/hooks/useFamilySyncedStorage';
import { FAMILY_STORAGE_KEYS, FamilyTransaction } from '@/types/familyFinance';
import { CreditCard } from '@/types/finance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { useFamilySync } from '@/contexts/FamilySyncContext';

interface FamilyFinanceSummaryCardProps {
  compact?: boolean;
}

export function FamilyFinanceSummaryCard({ compact = false }: FamilyFinanceSummaryCardProps) {
  const { t } = useTranslation(['cards', 'common']);
  const navigate = useNavigate();
  const { formatAmount } = usePrivacyMode();
  const { isConnected, familyCode } = useFamilySync();

  const [familyCards] = useFamilySyncedStorage<CreditCard[]>('kredi-pusula-family-cards', []);
  const [transactions] = useFamilySyncedStorage<FamilyTransaction[]>(FAMILY_STORAGE_KEYS.TRANSACTIONS, []);

  // If no family connected, show CTA
  if (!isConnected) {
    return (
      <button
        onClick={() => navigate('/family')}
        className="w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 p-4 text-left shadow-soft transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <UserPlus className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t('summaryCard.familyCta')}</p>
            <p className="text-xs text-muted-foreground">{t('summaryCard.familyCtaDesc')}</p>
          </div>
          <span className="text-muted-foreground text-sm">→</span>
        </div>
      </button>
    );
  }

  // Calculate family totals
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthlyTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const familyIncome = monthlyTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const familyExpense = monthlyTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const familyDebt = familyCards.reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  return (
    <button
      onClick={() => navigate('/family')}
      className={`w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 ${compact ? 'p-3' : 'p-4'} text-left shadow-soft transition-transform active:scale-[0.98]`}
    >
      <div className={`flex items-center gap-3 ${compact ? 'mb-2' : 'mb-3'}`}>
        <div className={`flex items-center justify-center rounded-xl bg-emerald-500/15 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
          <Users className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-emerald-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-bold truncate`}>{t('summaryCard.familyTitle')}</p>
          {!compact && <p className="text-[10px] text-muted-foreground">{t('summaryCard.familySubtitle')}</p>}
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
            <span className="text-[10px] font-bold text-green-600">{formatAmount(familyIncome)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-card/60 px-2 py-1">
            <span className="flex items-center gap-1">
              <ArrowDownCircle className="h-3 w-3 text-red-500" />
              <span className="text-[10px] text-muted-foreground">{t('summaryCard.expense')}</span>
            </span>
            <span className="text-[10px] font-bold text-red-600">{formatAmount(familyExpense)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-card/60 px-2 py-1">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground">{t('summaryCard.familyDebt')}</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-600">{formatAmount(familyDebt)}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card/60 p-2 text-center">
            <ArrowUpCircle className="mx-auto h-4 w-4 text-green-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{t('summaryCard.income')}</p>
            <p className="text-xs font-bold text-green-600">{formatAmount(familyIncome)}</p>
          </div>
          <div className="rounded-xl bg-card/60 p-2 text-center">
            <ArrowDownCircle className="mx-auto h-4 w-4 text-red-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{t('summaryCard.expense')}</p>
            <p className="text-xs font-bold text-red-600">{formatAmount(familyExpense)}</p>
          </div>
          <div className="rounded-xl bg-card/60 p-2 text-center">
            <Users className="mx-auto h-4 w-4 text-emerald-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{t('summaryCard.familyDebt')}</p>
            <p className="text-xs font-bold text-emerald-600">{formatAmount(familyDebt)}</p>
          </div>
        </div>
      )}
    </button>
  );
}
