import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Snowflake, Mountain, Trophy, ArrowRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CreditCard } from '@/types/finance';
import { Loan } from '@/types/loan';
import { Debt, compareStrategies, StrategyComparison } from '@/lib/debtStrategy';
import { formatCurrency, parseTurkishNumber } from '@/lib/financeUtils';

function formatTurkishInput(value: string): string {
  const num = parseTurkishNumber(value);
  if (num === 0 && value !== '0') return value;
  return num.toLocaleString('tr-TR');
}

const DebtStrategyAdvisor = () => {
  const { t } = useTranslation(['ai', 'cards']);
  const [cards] = useLocalStorage<CreditCard[]>('kredi-pusula-cards', []);
  const [loans] = useLocalStorage<Loan[]>('kredi-pusula-loans', []);
  const [extraPaymentInput, setExtraPaymentInput] = useState('500');

  const extraPayment = parseTurkishNumber(extraPaymentInput);

  // Convert cards and loans to Debt[] format
  const debts: Debt[] = useMemo(() => {
    const cardDebts: Debt[] = cards
      .filter((c) => c.currentDebt > 0)
      .map((c) => ({
        id: c.id,
        name: `${c.bankName} ${c.cardName}`,
        balance: c.currentDebt,
        interestRate: c.interestRate,
        minimumPayment: c.minimumPayment || c.currentDebt * 0.03,
      }));

    const loanDebts: Debt[] = loans
      .filter((l) => l.remainingBalance > 0 && !l.isPaid)
      .map((l) => ({
        id: l.id,
        name: `${l.bankName} - ${l.name}`,
        balance: l.remainingBalance,
        interestRate: l.interestRate,
        minimumPayment: l.monthlyPayment,
      }));

    return [...cardDebts, ...loanDebts];
  }, [cards, loans]);

  const comparison: StrategyComparison | null = useMemo(() => {
    if (debts.length < 2) return null;
    return compareStrategies(debts, extraPayment);
  }, [debts, extraPayment]);

  if (debts.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Scale className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t('ai:debt.noData')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) return null;

  const { snowball, avalanche, recommendation, recommendationReason, interestDifference, timeDifference } =
    comparison;

  const debtNameMap = new Map(debts.map((d) => [d.id, d.name]));

  return (
    <div className="space-y-4">
      {/* Extra Payment Input */}
      <Card>
        <CardContent className="py-4">
          <label className="mb-1 block text-xs font-medium">
            {t('ai:debt.extraPayment')}
          </label>
          <p className="mb-2 text-[10px] text-muted-foreground">
            {t('ai:debt.extraPaymentDesc')}
          </p>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={extraPaymentInput}
              onChange={(e) => setExtraPaymentInput(e.target.value)}
              onBlur={() => setExtraPaymentInput(formatTurkishInput(extraPaymentInput))}
              className="pr-10"
              placeholder="500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              TL
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Comparison */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Snowball */}
        <Card
          className={`border-2 transition-colors ${
            recommendation === 'snowball' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                <Snowflake className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-sm">{t('ai:debt.snowball')}</CardTitle>
                {recommendation === 'snowball' && (
                  <Badge className="mt-0.5 bg-primary/15 text-primary text-[9px]">
                    <Trophy className="mr-0.5 h-2.5 w-2.5" />
                    {t('ai:debt.recommendation')}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{t('ai:debt.snowballDesc')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">{t('ai:debt.totalInterest')}</span>
              <span className="text-xs font-semibold">{formatCurrency(snowball.totalInterest)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">{t('ai:debt.monthsToPayoff')}</span>
              <span className="text-xs font-semibold">
                {snowball.monthsToPayoff} {t('ai:debt.months')}
              </span>
            </div>

            {/* Payoff Order */}
            <div className="mt-2">
              <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                {t('ai:debt.payoffOrder')}
              </p>
              <div className="space-y-1">
                {snowball.payoffOrder.map((debtId, index) => (
                  <div key={debtId} className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-[10px] truncate">{debtNameMap.get(debtId) || debtId}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avalanche */}
        <Card
          className={`border-2 transition-colors ${
            recommendation === 'avalanche' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                <Mountain className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-sm">{t('ai:debt.avalanche')}</CardTitle>
                {recommendation === 'avalanche' && (
                  <Badge className="mt-0.5 bg-primary/15 text-primary text-[9px]">
                    <Trophy className="mr-0.5 h-2.5 w-2.5" />
                    {t('ai:debt.recommendation')}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{t('ai:debt.avalancheDesc')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">{t('ai:debt.totalInterest')}</span>
              <span className="text-xs font-semibold">{formatCurrency(avalanche.totalInterest)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">{t('ai:debt.monthsToPayoff')}</span>
              <span className="text-xs font-semibold">
                {avalanche.monthsToPayoff} {t('ai:debt.months')}
              </span>
            </div>

            {/* Payoff Order */}
            <div className="mt-2">
              <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                {t('ai:debt.payoffOrder')}
              </p>
              <div className="space-y-1">
                {avalanche.payoffOrder.map((debtId, index) => (
                  <div key={debtId} className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-[10px] truncate">{debtNameMap.get(debtId) || debtId}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t('ai:debt.recommendation')}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {recommendationReason}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {interestDifference > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {t('ai:debt.interestSaved')}: {formatCurrency(Math.abs(interestDifference))}
                </Badge>
              )}
              {timeDifference !== 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {t('ai:debt.timeSaved')}: {Math.abs(timeDifference)} {t('ai:debt.months')}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebtStrategyAdvisor;
