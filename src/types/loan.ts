// Kredi ve Gecikme Takip Tipleri

export type LoanType = 'konut' | 'ihtiyac' | 'tasit' | 'kobi' | 'diger';

export interface Loan {
  id: string;
  name: string;
  bankName: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number; // Aylık faiz oranı (%)
  termMonths: number;
  monthlyPayment: number;
  startDate: string; // ISO string
  dueDay: number; // 1-31
  remainingBalance: number;
  remainingInstallments: number;
  
  // Gecikme takibi
  lastPaymentDate?: string;
  isOverdue: boolean;
  overdueDays: number;
  overdueInterestRate: number; // Aylık gecikme faiz oranı (%)
  totalOverdueInterest: number;
  isPaid: boolean;
}

export interface LoanPaymentHistory {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  paymentDate?: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'pending' | 'paid' | 'overdue';
  overdueDays: number;
  overdueInterest: number;
}

export interface OverdueItem {
  id: string;
  type: 'loan' | 'credit_card';
  name: string;
  bankName: string;
  amount: number;
  dueDate: string;
  overdueDays: number;
  dailyInterestRate: number;
  dailyInterestAmount: number;
  totalOverdueInterest: number;
  isPaid: boolean;
}

// Kredi hesaplama sonuçları
export interface LoanCalculationResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  effectiveRate: number; // KKDF + BSMV dahil efektif faiz
  amortizationSchedule: AmortizationRow[];
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePayment: number;
}

// Gecikme hesaplama sonuçları
export interface OverdueCalculation {
  isOverdue: boolean;
  overdueDays: number;
  dailyRate: number;
  dailyAmount: number;
  totalInterest: number;
  totalWithInterest: number;
  severity: 'none' | 'warning' | 'danger' | 'critical';
}

// Banka seçenekleri
export const BANK_LIST = [
  'Yapı Kredi',
  'Garanti BBVA',
  'İş Bankası',
  'Akbank',
  'Ziraat Bankası',
  'Halkbank',
  'Vakıfbank',
  'QNB Finansbank',
  'Denizbank',
  'TEB',
  'ING',
  'HSBC',
  // Özel Mevduat Bankaları
  'Şekerbank',
  'Anadolubank',
  'Fibabanka',
  'Odeabank',
  'Turkish Bank',
  'Alternatifbank',
  'Burgan Bank',
  'ICBC Turkey',
  // Katılım Bankaları
  'Kuveyt Türk',
  'Türkiye Finans',
  'Albaraka Türk',
  'Ziraat Katılım',
  'Vakıf Katılım',
  'Emlak Katılım',
  'Hayat Finans',
  // Dijital Bankalar / Fintek
  'Enpara.com',
  'Papara',
  'Diğer'
] as const;

// Kredi türü etiketleri
export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  konut: 'Konut Kredisi',
  ihtiyac: 'İhtiyaç Kredisi',
  tasit: 'Taşıt Kredisi',
  kobi: 'KOBİ Kredisi',
  diger: 'Diğer Kredi'
};

// Varsayılan faiz oranları (2026)
export const DEFAULT_INTEREST_RATES: Record<LoanType, number> = {
  konut: 2.89,
  ihtiyac: 4.25,
  tasit: 3.75,
  kobi: 3.50,
  diger: 4.25
};

// Kredi sabitleri
export const LOAN_CONSTANTS = {
  MIN_TERM_MONTHS: 6,
  MAX_TERM_MONTHS: 120,
  KKDF_RATE: 15, // %15
  BSMV_RATE: 15, // %15
  
  // Gecikme faizi çarpanı (1.30 = %30 fazlası)
  OVERDUE_RATE_MULTIPLIER: 1.30,
  
  // Günlük faiz hesaplama için ay içi gün sayısı
  DAYS_IN_MONTH: 30,
};
