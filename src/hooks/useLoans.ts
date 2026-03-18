// Kredi Yönetim Hook'u

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Loan, LoanPaymentHistory, LoanCalculationResult, LOAN_CONSTANTS } from '@/types/loan';
import { generateAmortizationSchedule, calculateEffectiveRate } from '@/lib/overdueUtils';

export function useLoans() {
  const [loans, setLoans] = useLocalStorage<Loan[]>('kredi-pusula-loans', []);
  const [paymentHistory, setPaymentHistory] = useLocalStorage<LoanPaymentHistory[]>(
    'kredi-pusula-loan-payments',
    []
  );

  // Kredi ekleme
  const addLoan = useCallback((loan: Omit<Loan, 'id'>) => {
    const newLoan: Loan = {
      ...loan,
      id: crypto.randomUUID(),
    };
    setLoans((prev) => [...prev, newLoan]);
    return newLoan;
  }, [setLoans]);

  // Kredi güncelleme
  const updateLoan = useCallback((id: string, updates: Partial<Loan>) => {
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === id ? { ...loan, ...updates } : loan
      )
    );
  }, [setLoans]);

  // Kredi silme
  const deleteLoan = useCallback((id: string) => {
    setLoans((prev) => prev.filter((loan) => loan.id !== id));
    setPaymentHistory((prev) => prev.filter((payment) => payment.loanId !== id));
  }, [setLoans, setPaymentHistory]);

  // Ödeme kaydetme
  const recordPayment = useCallback((payment: Omit<LoanPaymentHistory, 'id'>) => {
    const newPayment: LoanPaymentHistory = {
      ...payment,
      id: crypto.randomUUID(),
    };
    setPaymentHistory((prev) => [...prev, newPayment]);

    // Kredi durumunu güncelle
    if (payment.status === 'paid') {
      updateLoan(payment.loanId, {
        remainingInstallments: (loans.find(l => l.id === payment.loanId)?.remainingInstallments ?? 1) - 1,
        lastPaymentDate: payment.paymentDate,
        isOverdue: false,
        overdueDays: 0,
        totalOverdueInterest: 0,
      });
    }

    return newPayment;
  }, [setPaymentHistory, updateLoan, loans]);

  // Ödendi olarak işaretle
  const markAsPaid = useCallback((loanId: string) => {
    updateLoan(loanId, {
      isOverdue: false,
      overdueDays: 0,
      totalOverdueInterest: 0,
      lastPaymentDate: new Date().toISOString(),
    });
  }, [updateLoan]);

  // Kredi hesaplama
  const calculateLoan = useCallback((
    principal: number,
    monthlyRate: number,
    termMonths: number,
    includeKKDFBSMV: boolean = true
  ): LoanCalculationResult => {
    const effectiveRate = includeKKDFBSMV 
      ? calculateEffectiveRate(monthlyRate)
      : monthlyRate;
    
    const result = generateAmortizationSchedule(principal, effectiveRate, termMonths);
    
    return {
      monthlyPayment: result.monthlyPayment,
      totalPayment: result.totalPayment,
      totalInterest: result.totalInterest,
      effectiveRate,
      amortizationSchedule: result.schedule,
    };
  }, []);

  // Geciken krediler
  const overdueLoans = useMemo(() => {
    return loans.filter((loan) => loan.isOverdue && !loan.isPaid);
  }, [loans]);

  // Toplam kalan borç
  const totalRemainingBalance = useMemo(() => {
    return loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  }, [loans]);

  // Aylık toplam taksit
  const totalMonthlyPayment = useMemo(() => {
    return loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  }, [loans]);

  // Bir kredinin ödeme geçmişi
  const getPaymentHistory = useCallback((loanId: string) => {
    return paymentHistory.filter((payment) => payment.loanId === loanId);
  }, [paymentHistory]);

  return {
    loans,
    paymentHistory,
    addLoan,
    updateLoan,
    deleteLoan,
    recordPayment,
    markAsPaid,
    calculateLoan,
    overdueLoans,
    totalRemainingBalance,
    totalMonthlyPayment,
    getPaymentHistory,
  };
}
