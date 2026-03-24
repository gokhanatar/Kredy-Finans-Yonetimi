// Gecikme Faizi Hesaplama Fonksiyonları

import { differenceInDays, startOfDay, isBefore } from 'date-fns';
import { FINANCIAL_CONSTANTS } from '@/types/finance';
import { OverdueCalculation, LOAN_CONSTANTS } from '@/types/loan';

/**
 * Günlük gecikme faizi hesaplama
 */
export function calculateDailyOverdueInterest(
  amount: number,
  monthlyRate: number,
  overdueDays: number
): {
  dailyRate: number;
  dailyAmount: number;
  totalInterest: number;
  totalWithInterest: number;
} {
  const dailyRate = monthlyRate / LOAN_CONSTANTS.DAYS_IN_MONTH;
  const dailyAmount = amount * (dailyRate / 100);
  const totalInterest = dailyAmount * overdueDays;
  const totalWithInterest = amount + totalInterest;

  return {
    dailyRate,
    dailyAmount,
    totalInterest,
    totalWithInterest
  };
}

/**
 * BDDK 2026 kademeli gecikme faiz oranını belirle
 */
export function getTieredOverdueRate(debtAmount: number): number {
  const { TIERED_INTEREST_RATES } = FINANCIAL_CONSTANTS;
  
  if (debtAmount < 30000) {
    return TIERED_INTEREST_RATES.UNDER_30K.late;
  } else if (debtAmount <= 180000) {
    return TIERED_INTEREST_RATES.BETWEEN_30K_180K.late;
  } else {
    return TIERED_INTEREST_RATES.OVER_180K.late;
  }
}

/**
 * Kademeli gecikme faizi hesaplama (BDDK 2026)
 */
export function calculateTieredOverdueInterest(
  debtAmount: number,
  overdueDays: number
): number {
  const monthlyRate = getTieredOverdueRate(debtAmount);
  const { totalInterest } = calculateDailyOverdueInterest(
    debtAmount,
    monthlyRate,
    overdueDays
  );
  return totalInterest;
}

/**
 * Gecikme durumunu kontrol et
 */
export function checkOverdueStatus(
  dueDate: Date | string,
  isPaid: boolean
): {
  isOverdue: boolean;
  overdueDays: number;
  severity: 'none' | 'warning' | 'danger' | 'critical';
} {
  if (isPaid) {
    return { isOverdue: false, overdueDays: 0, severity: 'none' };
  }

  const today = startOfDay(new Date());
  const due = startOfDay(typeof dueDate === 'string' ? new Date(dueDate) : dueDate);
  
  if (!isBefore(due, today)) {
    return { isOverdue: false, overdueDays: 0, severity: 'none' };
  }

  const overdueDays = differenceInDays(today, due);
  
  let severity: 'warning' | 'danger' | 'critical';
  if (overdueDays <= 7) {
    severity = 'warning';
  } else if (overdueDays <= 30) {
    severity = 'danger';
  } else {
    severity = 'critical';
  }

  return { isOverdue: true, overdueDays, severity };
}

/**
 * Kredi kartı günlük gecikme faizi hesaplama
 */
export function calculateCardDailyInterest(
  currentDebt: number,
  dueDate: Date | string,
  isPaid: boolean
): OverdueCalculation {
  const status = checkOverdueStatus(dueDate, isPaid);
  
  if (!status.isOverdue) {
    return {
      isOverdue: false,
      overdueDays: 0,
      dailyRate: 0,
      dailyAmount: 0,
      totalInterest: 0,
      totalWithInterest: currentDebt,
      severity: 'none'
    };
  }

  const monthlyRate = getTieredOverdueRate(currentDebt);
  const calculation = calculateDailyOverdueInterest(
    currentDebt,
    monthlyRate,
    status.overdueDays
  );

  return {
    isOverdue: true,
    overdueDays: status.overdueDays,
    dailyRate: calculation.dailyRate,
    dailyAmount: calculation.dailyAmount,
    totalInterest: calculation.totalInterest,
    totalWithInterest: calculation.totalWithInterest,
    severity: status.severity
  };
}

/**
 * Kredi günlük gecikme faizi hesaplama
 */
export function calculateLoanDailyInterest(
  monthlyPayment: number,
  overdueRate: number,
  overdueDays: number
): OverdueCalculation {
  if (overdueDays <= 0) {
    return {
      isOverdue: false,
      overdueDays: 0,
      dailyRate: 0,
      dailyAmount: 0,
      totalInterest: 0,
      totalWithInterest: monthlyPayment,
      severity: 'none'
    };
  }

  const calculation = calculateDailyOverdueInterest(
    monthlyPayment,
    overdueRate,
    overdueDays
  );

  let severity: 'warning' | 'danger' | 'critical';
  if (overdueDays <= 7) {
    severity = 'warning';
  } else if (overdueDays <= 30) {
    severity = 'danger';
  } else {
    severity = 'critical';
  }

  return {
    isOverdue: true,
    overdueDays,
    dailyRate: calculation.dailyRate,
    dailyAmount: calculation.dailyAmount,
    totalInterest: calculation.totalInterest,
    totalWithInterest: calculation.totalWithInterest,
    severity
  };
}

/**
 * Kredi aylık taksit hesaplama (PMT formülü)
 */
export function calculateMonthlyPayment(
  principal: number,
  monthlyInterestRate: number,
  termMonths: number
): number {
  const r = monthlyInterestRate / 100;
  
  if (r === 0) {
    return principal / termMonths;
  }
  
  const factor = Math.pow(1 + r, termMonths);
  return principal * (r * factor) / (factor - 1);
}

/**
 * Efektif faiz hesaplama (KKDF + BSMV dahil)
 */
export function calculateEffectiveRate(baseRate: number): number {
  const kkdfMultiplier = 1 + (LOAN_CONSTANTS.KKDF_RATE / 100);
  const bsmvMultiplier = 1 + (LOAN_CONSTANTS.BSMV_RATE / 100);
  return baseRate * kkdfMultiplier * bsmvMultiplier;
}

/**
 * Amortisman tablosu oluşturma
 */
export function generateAmortizationSchedule(
  principal: number,
  monthlyInterestRate: number,
  termMonths: number
): {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
    cumulativeInterest: number;
    cumulativePayment: number;
  }[];
} {
  const monthlyPayment = calculateMonthlyPayment(principal, monthlyInterestRate, termMonths);
  const r = monthlyInterestRate / 100;
  
  let balance = principal;
  let cumulativeInterest = 0;
  let cumulativePayment = 0;
  const schedule = [];

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * r;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);
    cumulativeInterest += interestPayment;
    cumulativePayment += monthlyPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
      cumulativeInterest,
      cumulativePayment
    });
  }

  return {
    monthlyPayment,
    totalPayment: monthlyPayment * termMonths,
    totalInterest: cumulativeInterest,
    schedule
  };
}

/**
 * Gecikme bildirim mesajı oluşturma
 */
export function generateOverdueMessage(
  name: string,
  type: 'credit_card' | 'loan',
  overdueDays: number,
  dailyAmount: number,
  totalInterest: number
): string {
  const emoji = type === 'credit_card' ? '💳' : '🏦';
  const typeLabel = type === 'credit_card' ? 'kartınız' : 'krediniz';
  
  const formattedDaily = dailyAmount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const formattedTotal = totalInterest.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (overdueDays === 1) {
    return `${emoji} ${name} ${typeLabel} gecikti! Bugün ${formattedDaily} TL faiz bindi. Toplam: ${formattedTotal} TL`;
  }
  
  return `${emoji} ${name} ${typeLabel} ${overdueDays} gündür gecikiyor. Bugün ${formattedDaily} TL faiz bindi. Toplam: ${formattedTotal} TL`;
}

/**
 * Severity'ye göre renk sınıfı döndürme
 */
export function getSeverityColor(severity: 'none' | 'warning' | 'danger' | 'critical'): string {
  switch (severity) {
    case 'warning':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'danger':
      return 'text-orange-500 bg-orange-500/10';
    case 'critical':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-green-500 bg-green-500/10';
  }
}
