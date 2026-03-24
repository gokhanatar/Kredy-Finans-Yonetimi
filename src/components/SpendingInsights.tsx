import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStorageForScope } from '@/hooks/useStorageForScope';
import { PERSONAL_STORAGE_KEYS } from '@/types/familyFinance';
import { FamilyTransaction } from '@/types/familyFinance';
import { analyzeSpendingTrends, generateInsights } from '@/lib/spendingAnalysis';
import { formatCurrency } from '@/lib/financeUtils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { EXPENSE_CATEGORIES } from '@/types/familyFinance';

function getCategoryIcon(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.id === category);
  return found?.icon || 'package';
}

function getCategoryLabel(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.id === category);
  return found?.label || category;
}

const SpendingInsights = () => {
  const { t } = useTranslation(['ai', 'family']);
  const [transactions] = useStorageForScope<FamilyTransaction[]>(
    PERSONAL_STORAGE_KEYS.TRANSACTIONS,
    [],
    'personal'
  );

  const trends = useMemo(() => analyzeSpendingTrends(transactions, 3), [transactions]);
  const insights = useMemo(() => generateInsights(transactions), [transactions]);

  const hasData = trends.length > 0 || insights.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <BarChart3 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t('ai:insights.noData')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trend Cards */}
      {trends.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {t('ai:insights.title')}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {t('ai:insights.subtitle')}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {trends.map((trend) => {
              const isUp = trend.direction === 'up';
              const isDown = trend.direction === 'down';
              const isStable = trend.direction === 'stable';

              return (
                <Card
                  key={trend.category}
                  className={`border-l-4 ${
                    isDown
                      ? 'border-l-success'
                      : isUp
                        ? 'border-l-danger'
                        : 'border-l-muted-foreground'
                  }`}
                >
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isDown
                          ? 'bg-success/10 text-success'
                          : isUp
                            ? 'bg-danger/10 text-danger'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <CategoryIcon name={getCategoryIcon(trend.category)} size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {getCategoryLabel(trend.category)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(trend.currentMonth)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isUp && <TrendingUp className="h-4 w-4 text-danger" />}
                      {isDown && <TrendingDown className="h-4 w-4 text-success" />}
                      {isStable && <Minus className="h-4 w-4 text-muted-foreground" />}
                      <span
                        className={`text-xs font-semibold ${
                          isDown
                            ? 'text-success'
                            : isUp
                              ? 'text-danger'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {isStable
                          ? t('ai:insights.stable', { category: '' }).trim()
                          : `%${Math.abs(trend.changePercent).toFixed(0)}`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Insight Messages */}
      {insights.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {t('ai:insights.topCategories')}
          </h3>

          <div className="space-y-2">
            {insights.map((insight, index) => {
              const isIncrease = insight.type === 'increase';
              const isDecrease = insight.type === 'decrease';
              const isAnomaly = insight.type === 'anomaly';
              const isTip = insight.type === 'tip';

              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="flex items-start gap-3 py-3 px-4">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isIncrease
                          ? 'bg-danger/10'
                          : isDecrease
                            ? 'bg-success/10'
                            : isAnomaly
                              ? 'bg-warning/10'
                              : 'bg-primary/10'
                      }`}
                    >
                      {isIncrease && <TrendingUp className="h-4 w-4 text-danger" />}
                      {isDecrease && <TrendingDown className="h-4 w-4 text-success" />}
                      {isAnomaly && <AlertTriangle className="h-4 w-4 text-warning" />}
                      {isTip && <Lightbulb className="h-4 w-4 text-primary" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {insight.category && (
                          <Badge variant="secondary" className="text-[10px]">
                            {getCategoryLabel(insight.category)}
                          </Badge>
                        )}
                        {insight.changePercent !== undefined && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isDecrease ? 'text-success' : isIncrease ? 'text-danger' : ''
                            }`}
                          >
                            {insight.changePercent > 0 ? '+' : ''}
                            {insight.changePercent.toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {insight.message}
                      </p>
                      {insight.value !== undefined && (
                        <p className="mt-1 text-xs font-medium">
                          {formatCurrency(insight.value)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingInsights;
