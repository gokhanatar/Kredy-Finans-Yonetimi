import { Account, KMH_CONSTANTS } from '@/types/familyFinance';

/**
 * KMH (Kredili Mevduat Hesabı) utility functions
 * TCMB Ocak 2026 oranları + BDDK kuralları
 */

export type KMHSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface KMHDailyInterest {
  grossInterest: number;
  netCost: number;       // brüt × 1.20 (KKDF + BSMV dahil)
  dailyRate: number;     // günlük oran
  daysNegative: number;
}

export interface KMHProjection {
  days: number;
  accruedInterest: number;
  totalDebt: number;     // anapara + faiz
}

/**
 * Günlük KMH faizi hesapla
 * Formül: brütFaiz = anapara × (aylıkOran / 100 / 30) × gün
 * netMaliyet = brüt × 1.20
 */
export function calculateKMHDailyInterest(
  negativeBalance: number,
  monthlyRate: number,
  days: number
): KMHDailyInterest {
  if (negativeBalance >= 0 || days <= 0) {
    return { grossInterest: 0, netCost: 0, dailyRate: 0, daysNegative: 0 };
  }

  const principal = Math.abs(negativeBalance);
  const dailyRate = monthlyRate / 100 / 30;
  const grossInterest = principal * dailyRate * days;
  const netCost = grossInterest * KMH_CONSTANTS.TAX_MULTIPLIER;

  return {
    grossInterest: Math.round(grossInterest * 100) / 100,
    netCost: Math.round(netCost * 100) / 100,
    dailyRate: Math.round(dailyRate * 10000) / 10000,
    daysNegative: days,
  };
}

/**
 * KMH limitinin BDDK kuralına uygun olup olmadığını kontrol et
 * Kural: KMH limiti max aylık gelirin 2 katı
 */
export function validateKMHLimit(kmhLimit: number, monthlyIncome: number): {
  isValid: boolean;
  maxAllowed: number;
  message?: string;
} {
  const maxAllowed = monthlyIncome * KMH_CONSTANTS.MAX_INCOME_MULTIPLIER;

  if (kmhLimit <= maxAllowed) {
    return { isValid: true, maxAllowed };
  }

  return {
    isValid: false,
    maxAllowed,
    message: `KMH limiti aylık gelirin ${KMH_CONSTANTS.MAX_INCOME_MULTIPLIER} katını aşamaz (max: ${maxAllowed.toLocaleString('tr-TR')} ₺)`,
  };
}

/**
 * KMH kullanım seviyesini belirle
 */
export function getKMHSeverity(account: Account): KMHSeverity {
  if (!account.kmhEnabled || !account.kmhLimit || account.balance >= 0) {
    return 'none';
  }

  const usage = Math.abs(account.balance) / account.kmhLimit;

  if (usage <= KMH_CONSTANTS.SEVERITY_LOW) return 'low';
  if (usage <= KMH_CONSTANTS.SEVERITY_MEDIUM) return 'medium';
  if (usage <= KMH_CONSTANTS.SEVERITY_HIGH) return 'high';
  return 'critical';
}

/**
 * KMH kullanım yüzdesini hesapla
 */
export function getKMHUsagePercent(account: Account): number {
  if (!account.kmhEnabled || !account.kmhLimit || account.balance >= 0) {
    return 0;
  }
  return Math.min((Math.abs(account.balance) / account.kmhLimit) * 100, 100);
}

/**
 * Gelecek projeksiyonu - X gün sonra birikecek faiz
 */
export function calculateKMHProjection(
  negativeBalance: number,
  monthlyRate: number,
  projectionDays: number[]
): KMHProjection[] {
  if (negativeBalance >= 0) return [];

  const principal = Math.abs(negativeBalance);

  return projectionDays.map((days) => {
    const interest = calculateKMHDailyInterest(negativeBalance, monthlyRate, days);
    return {
      days,
      accruedInterest: interest.netCost,
      totalDebt: Math.round((principal + interest.netCost) * 100) / 100,
    };
  });
}

/**
 * Negatif bakiye gün sayısını hesapla
 */
export function calculateDaysNegative(lastNegativeDate: string | undefined): number {
  if (!lastNegativeDate) return 0;

  const start = new Date(lastNegativeDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Severity'ye göre renk sınıfları
 */
export function getKMHSeverityColor(severity: KMHSeverity): {
  bg: string;
  text: string;
  border: string;
  progress: string;
} {
  switch (severity) {
    case 'low':
      return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', progress: 'bg-success' };
    case 'medium':
      return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', progress: 'bg-warning' };
    case 'high':
      return { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30', progress: 'bg-orange-500' };
    case 'critical':
      return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30', progress: 'bg-danger' };
    default:
      return { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/30', progress: 'bg-muted' };
  }
}
