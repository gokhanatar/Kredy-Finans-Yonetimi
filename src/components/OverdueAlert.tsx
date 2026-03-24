import { AlertTriangle, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OverdueItem } from "@/types/loan";
import { getSeverityColor } from "@/lib/overdueUtils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

interface OverdueAlertProps {
  overdueItems: OverdueItem[];
  totalInterest?: number;
  todaysInterest?: number;
  onViewAll?: () => void;
}

export function OverdueAlert({ overdueItems, totalInterest, todaysInterest, onViewAll }: OverdueAlertProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['cards']);

  // Calculate totals if not provided
  const calculatedTodaysInterest = todaysInterest ?? overdueItems.reduce((sum, item) => sum + item.dailyInterestAmount, 0);
  const calculatedTotalInterest = totalInterest ?? overdueItems.reduce((sum, item) => sum + item.totalOverdueInterest, 0);

  if (overdueItems.length === 0) {
    return null;
  }

  const maxSeverity = overdueItems.some(i => i.overdueDays > 30)
    ? 'critical'
    : overdueItems.some(i => i.overdueDays > 7)
      ? 'danger'
      : 'warning';

  const severityColors = {
    warning: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    danger: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    critical: 'from-red-500/20 to-red-600/10 border-red-500/30',
  };

  const severityIcons = {
    warning: 'text-yellow-500',
    danger: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <Card className={`border bg-gradient-to-br ${severityColors[maxSeverity]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className={`h-5 w-5 ${severityIcons[maxSeverity]}`} />
          {t('overdue.title')}
          <Badge variant="destructive" className="ml-auto">
            {overdueItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Özet Bilgiler */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {t('overdue.todaysInterest')}
            </div>
            <p className="mt-1 text-lg font-bold text-destructive">
              +{calculatedTodaysInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
          <div className="rounded-lg bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {t('overdue.totalInterest')}
            </div>
            <p className="mt-1 text-lg font-bold text-destructive">
              {calculatedTotalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
        </div>

        {/* İlk 2 Gecikmiş Ödeme */}
        <div className="space-y-2">
          {overdueItems.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-background/50 p-2"
            >
              <div className="flex items-center gap-2">
                <span>{item.type === 'credit_card' ? '💳' : '🏦'}</span>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('overdue.daysOverdue', { days: item.overdueDays })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-destructive">
                  +{item.dailyInterestAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {t('overdue.dailyRate')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {overdueItems.length > 2 && (
          <p className="text-center text-xs text-muted-foreground">
            {t('overdue.morePayments', { count: overdueItems.length - 2 })}
          </p>
        )}

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onViewAll ?? (() => navigate('/loans'))}
        >
          {t('overdue.viewAll')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
