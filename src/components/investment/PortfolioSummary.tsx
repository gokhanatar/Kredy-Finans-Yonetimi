import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, Wallet } from 'lucide-react';
import { Investment, InvestmentCategory, INVESTMENT_CATEGORY_LABEL_KEYS, INVESTMENT_CATEGORY_EMOJIS } from '@/types/investment';
import { useInvestmentPricesContext } from '@/contexts/InvestmentPricesContext';
import { cn } from '@/lib/utils';

interface PortfolioSummaryProps {
  investments: Investment[];
}

export function PortfolioSummary({ investments }: PortfolioSummaryProps) {
  const { t } = useTranslation(['investments', 'common']);
  const { getCurrentValue } = useInvestmentPricesContext();

  const totalCost = investments.reduce(
    (sum, inv) => sum + inv.quantity * inv.purchasePrice,
    0
  );

  const totalCurrentValue = investments.reduce(
    (sum, inv) => sum + getCurrentValue(inv.subType, inv.quantity),
    0
  );

  // If no live prices, use cost as fallback
  const displayValue = totalCurrentValue > 0 ? totalCurrentValue : totalCost;
  const profitLoss = totalCurrentValue > 0 ? totalCurrentValue - totalCost : 0;
  const profitLossPercent = totalCost > 0 && totalCurrentValue > 0 ? (profitLoss / totalCost) * 100 : 0;
  const isProfit = profitLoss > 0;
  const isLoss = profitLoss < 0;

  // Category breakdown
  const categories = (Object.keys(INVESTMENT_CATEGORY_LABEL_KEYS) as InvestmentCategory[])
    .map((cat) => {
      const catInvestments = investments.filter((inv) => inv.category === cat);
      if (catInvestments.length === 0) return null;

      const catCost = catInvestments.reduce(
        (sum, inv) => sum + inv.quantity * inv.purchasePrice,
        0
      );
      const catValue = catInvestments.reduce(
        (sum, inv) => sum + getCurrentValue(inv.subType, inv.quantity),
        0
      );

      return {
        category: cat,
        label: t(INVESTMENT_CATEGORY_LABEL_KEYS[cat]),
        emoji: INVESTMENT_CATEGORY_EMOJIS[cat],
        count: catInvestments.length,
        cost: catCost,
        value: catValue > 0 ? catValue : catCost,
        pnl: catValue > 0 ? catValue - catCost : 0,
        percent: displayValue > 0 ? ((catValue > 0 ? catValue : catCost) / displayValue) * 100 : 0,
      };
    })
    .filter(Boolean);

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/30 py-12">
        <Wallet className="h-12 w-12 text-muted-foreground opacity-50" />
        <p className="mt-4 text-muted-foreground">{t('portfolio.noInvestments')}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('portfolio.startAdding')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Portfolio Value */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
        <p className="text-sm text-muted-foreground">{t('portfolio.totalValue')}</p>
        <p className="text-3xl font-bold mt-1">
          {displayValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
        </p>

        {totalCurrentValue > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-1 rounded-lg px-2.5 py-1',
              isProfit && 'bg-success/10 text-success',
              isLoss && 'bg-destructive/10 text-destructive',
              !isProfit && !isLoss && 'bg-muted text-muted-foreground'
            )}>
              {isProfit && <TrendingUp className="h-4 w-4" />}
              {isLoss && <TrendingDown className="h-4 w-4" />}
              {!isProfit && !isLoss && <Minus className="h-4 w-4" />}
              <span className="text-sm font-bold">
                {isProfit ? '+' : ''}{profitLoss.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
              <span className="text-xs">
                ({isProfit ? '+' : ''}{profitLossPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('portfolio.totalCost', { value: totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) })}</span>
          <span>{t('portfolio.investmentCount', { count: investments.length })}</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <h3 className="font-semibold text-sm mb-3">{t('portfolio.distribution')}</h3>
        <div className="space-y-3">
          {categories.map((cat) => {
            if (!cat) return null;
            const catPnlPercent = cat.cost > 0 && cat.value !== cat.cost
              ? ((cat.value - cat.cost) / cat.cost) * 100
              : 0;

            return (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{cat.emoji}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">({cat.count})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {cat.value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                    </span>
                    {catPnlPercent !== 0 && (
                      <span className={cn(
                        'text-xs font-medium',
                        catPnlPercent > 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {catPnlPercent > 0 ? '+' : ''}{catPnlPercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(cat.percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
