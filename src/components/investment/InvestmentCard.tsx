import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, Trash2, Edit3 } from 'lucide-react';
import { Investment, getInvestmentLabel, INVESTMENT_CATEGORY_EMOJIS, CRYPTO_INFO } from '@/types/investment';
import { useInvestmentPricesContext } from '@/contexts/InvestmentPricesContext';
import { cn } from '@/lib/utils';

interface InvestmentCardProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

export function InvestmentCard({ investment, onEdit, onDelete }: InvestmentCardProps) {
  const { t } = useTranslation(['investments']);
  const { getCurrentValue, getPrice } = useInvestmentPricesContext();

  const totalCost = investment.quantity * investment.purchasePrice;
  const currentValue = getCurrentValue(investment.subType, investment.quantity);
  const currentPrice = getPrice(investment.subType);
  const hasLivePrice = currentPrice !== null && currentPrice.sellPrice > 0;

  const profitLoss = hasLivePrice ? currentValue - totalCost : 0;
  const profitLossPercent = hasLivePrice && totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
  const isProfit = profitLoss > 0;
  const isLoss = profitLoss < 0;

  const label = getInvestmentLabel(investment.category, investment.subType, investment.customName);
  const cryptoInfo = investment.category === 'kripto' ? CRYPTO_INFO[investment.subType] : null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {cryptoInfo ? (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
              style={{ backgroundColor: cryptoInfo.color }}
            >
              {cryptoInfo.symbol}
            </div>
          ) : (
            <span className="text-2xl">{INVESTMENT_CATEGORY_EMOJIS[investment.category]}</span>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm">{label}</p>
              {investment.exchange && (
                <span className={cn(
                  'rounded px-1 py-0.5 text-[9px] font-bold text-white',
                  investment.exchange === 'bist' ? 'bg-red-500' : 'bg-blue-500'
                )}>
                  {investment.exchange === 'bist' ? 'BIST' : 'ABD'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {investment.quantity} {t('investments:card.quantityUnit')} {investment.purchasePrice.toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(investment)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(investment.id)}
            className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{t('investments:card.cost')}</p>
          <p className="font-medium text-sm">
            {totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </p>
        </div>

        {hasLivePrice ? (
          <>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t('investments:card.currentValue')}</p>
              <p className="font-bold text-sm">
                {currentValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </p>
            </div>
            <div className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1',
              isProfit && 'bg-success/10 text-success',
              isLoss && 'bg-destructive/10 text-destructive',
              !isProfit && !isLoss && 'bg-muted text-muted-foreground'
            )}>
              {isProfit && <TrendingUp className="h-3 w-3" />}
              {isLoss && <TrendingDown className="h-3 w-3" />}
              {!isProfit && !isLoss && <Minus className="h-3 w-3" />}
              <span className="text-xs font-bold">
                {isProfit ? '+' : ''}{profitLossPercent.toFixed(1)}%
              </span>
            </div>
          </>
        ) : (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('investments:card.noPrice')}</p>
            <button
              onClick={() => onEdit(investment)}
              className="text-xs text-primary font-medium hover:underline"
            >
              {t('investments:card.updatePrice')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
