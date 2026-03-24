import { useTranslation } from 'react-i18next';
import { NetWorthSnapshot } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NetWorthChartProps {
  snapshots: NetWorthSnapshot[];
  latestSnapshot: NetWorthSnapshot | null;
  trend: number;
}

export function NetWorthChart({ snapshots, latestSnapshot, trend }: NetWorthChartProps) {
  const { t } = useTranslation(['family', 'common']);
  const { formatAmount, isPrivate } = usePrivacyMode();

  const chartData = snapshots.map((s) => ({
    date: format(new Date(s.date), 'MMM yy', { locale: tr }),
    netWorth: s.netWorth,
    assets: s.totalAssets,
    liabilities: s.totalLiabilities,
  }));

  return (
    <div className="space-y-3">
      {/* Current Net Worth */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/5 p-4">
        <p className="text-xs text-muted-foreground">{t('netWorth.title')}</p>
        <p className="text-2xl font-bold">
          {latestSnapshot ? formatAmount(latestSnapshot.netWorth) : formatAmount(0)}
        </p>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{formatAmount(Math.abs(trend))} {trend > 0 ? t('netWorth.increase') : t('netWorth.decrease')}</span>
          </div>
        )}
      </div>

      {/* Assets & Liabilities */}
      {latestSnapshot && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-green-500/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('common:total')}</p>
            <p className="text-sm font-bold text-green-600">{formatAmount(latestSnapshot.totalAssets)}</p>
          </div>
          <div className="rounded-lg bg-red-500/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('budget.spent')}</p>
            <p className="text-sm font-bold text-red-600">{formatAmount(latestSnapshot.totalLiabilities)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && !isPrivate && (
        <div className="rounded-xl bg-card p-3 shadow-sm">
          <h4 className="mb-2 text-sm font-semibold">{t('netWorth.title')}</h4>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                  return v.toString();
                }}
              />
              <Tooltip
                formatter={(value: number) => [formatAmount(value), t('netWorth.title')]}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#6366f1"
                fill="url(#netWorthGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length <= 1 && (
        <div className="rounded-xl bg-card p-4 text-center text-sm text-muted-foreground shadow-sm">
          {t('common:empty.noData')}
        </div>
      )}
    </div>
  );
}
