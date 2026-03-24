import { useTranslation } from 'react-i18next';
import { Account } from '@/types/familyFinance';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { formatCurrency } from '@/lib/financeUtils';
import {
  getKMHSeverity,
  getKMHUsagePercent,
  getKMHSeverityColor,
  calculateKMHDailyInterest,
  calculateDaysNegative,
} from '@/lib/kmhUtils';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BankAccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function BankAccountCard({ account, onEdit, onDelete }: BankAccountCardProps) {
  const { t } = useTranslation(['family']);
  const { formatAmount, isPrivate } = usePrivacyMode();

  const severity = getKMHSeverity(account);
  const usagePercent = getKMHUsagePercent(account);
  const severityColor = getKMHSeverityColor(severity);
  const daysNegative = calculateDaysNegative(account.kmhLastNegativeDate);

  const dailyInterest = account.kmhEnabled && account.balance < 0
    ? calculateKMHDailyInterest(
        account.balance,
        account.kmhInterestRate || 4.25,
        daysNegative || 1,
      )
    : null;

  const isNegative = account.balance < 0;
  const hasKMH = account.kmhEnabled && account.kmhLimit;

  return (
    <div className={cn(
      "rounded-xl bg-card p-4 shadow-sm border",
      severity === 'critical' && "border-danger/30",
      severity === 'high' && "border-orange-500/30",
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${account.color} text-lg`}>
          <CategoryIcon name={account.icon || 'building-2'} size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{account.name}</p>
          <p className="text-xs text-muted-foreground">
            {account.bankName || t('accounts.typeShort.bank')}
            {account.lastFourDigits && ` • ****${account.lastFourDigits}`}
          </p>
        </div>
        <span className={cn(
          "text-lg font-bold",
          isNegative ? 'text-destructive' : 'text-success',
        )}>
          {formatAmount(account.balance)}
        </span>
      </div>

      {/* KMH Usage Bar */}
      {hasKMH && isNegative && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t('accounts.kmh.usage', { defaultValue: 'KMH Kullanımı' })}
            </span>
            <span className={cn("font-semibold", severityColor.text)}>
              {isPrivate ? '***' : `${usagePercent.toFixed(0)}%`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", severityColor.progress)}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{isPrivate ? '***' : formatCurrency(account.kmhLimit!)}</span>
          </div>
        </div>
      )}

      {/* KMH Severity Badge + Daily Interest */}
      {hasKMH && isNegative && severity !== 'none' && (
        <div className={cn("mt-2 rounded-lg p-2.5", severityColor.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(severity === 'high' || severity === 'critical') && (
                <AlertTriangle className={cn("h-4 w-4", severityColor.text)} />
              )}
              {severity === 'medium' && (
                <TrendingDown className={cn("h-4 w-4", severityColor.text)} />
              )}
              <span className={cn("text-xs font-semibold", severityColor.text)}>
                {severity === 'low' && t('accounts.kmh.severityLow', { defaultValue: 'Düşük Risk' })}
                {severity === 'medium' && t('accounts.kmh.severityMedium', { defaultValue: 'Orta Risk' })}
                {severity === 'high' && t('accounts.kmh.severityHigh', { defaultValue: 'Yüksek Risk' })}
                {severity === 'critical' && t('accounts.kmh.severityCritical', { defaultValue: 'Kritik!' })}
              </span>
            </div>
            {dailyInterest && dailyInterest.netCost > 0 && (
              <span className={cn("text-xs font-bold", severityColor.text)}>
                {isPrivate ? '***' : `${formatCurrency(dailyInterest.netCost)} ${t('accounts.kmh.accruedLabel', { defaultValue: 'faiz' })}`}
              </span>
            )}
          </div>
          {dailyInterest && daysNegative > 0 && (
            <p className="text-xs mt-1 opacity-70">
              {t('accounts.kmh.daysNegative', {
                defaultValue: '{{days}} gündür negatif bakiye',
                days: daysNegative,
              })}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-1 justify-end">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(account)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(account.id)}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
