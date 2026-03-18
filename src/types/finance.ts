export interface CardInstallment {
  id: string;
  cardId: string;
  description: string;
  merchant?: string;
  category: string;
  totalAmount: number;
  installmentCount: number;
  monthlyPayment: number;
  paidInstallments: number;
  isRetroactive: boolean;
  createdAt: string;
  startDate?: string;
  completedAt?: string;
  notes?: string;
}

export interface CreditCard {
  id: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  cardType: "bireysel" | "ticari";
  limit: number;
  currentDebt: number;
  availableLimit: number;
  minimumPayment: number;
  statementDate: number; // Day of month (1-31)
  dueDate: number; // Day of month (1-31)
  interestRate: number;
  color: string;
  icon?: string;
  sharedWithFamily?: boolean;
}

export interface Payment {
  id: string;
  cardId: string;
  amount: number;
  dueDate: Date;
  type: "minimum" | "full" | "partial";
  status: "pending" | "paid" | "overdue";
}

export interface Transaction {
  id: string;
  cardId: string;
  amount: number;
  description: string;
  category: TransactionCategory;
  date: Date;
  installments?: number;
  currentInstallment?: number;
}

export type TransactionCategory =
  | "gida"
  | "akaryakit"
  | "telekom"
  | "elektronik"
  | "mobilya"
  | "giyim"
  | "saglik"
  | "egitim"
  | "eglence"
  | "diger";

export interface TaksitLimit {
  category: TransactionCategory;
  maxInstallments: number;
  minAmount?: number;
  label: string;
}

export interface DebtRollingSimulation {
  sourceCardId: string;
  targetCardId: string;
  amount: number;
  cashAdvanceFee: number; // %4.25
  kkdfRate: number; // %15
  bsmvRate: number; // %15
  transactionFee: number; // %1
  totalCost: number;
  monthlyPayment: number;
  totalPayment: number;
  riskLevel: "low" | "medium" | "high";
  warnings: string[];
}

export interface FinancialHealth {
  totalDebt: number;
  totalLimit: number;
  totalAvailable: number;
  utilizationRate: number;
  findeksRisk: "low" | "medium" | "high";
  upcomingPayments: Payment[];
  recommendations: string[];
}

export interface GoldenWindowCard {
  card: CreditCard;
  daysUntilPayment: number;
  isGoldenWindow: boolean;
  goldenRating: number;        // 5→1 yıldız (gün 1→5), 0 = pencere dışı
  goldenDaysRemaining: number; // kaç gün daha altın pencerede (0 = pencere dışı)
  recommendation: string;
}

// Restructuring Simulation Interface
export interface RestructuringSimulation {
  totalDebt: number;
  cardLimit: number;
  termMonths: number;
  monthlyInterestRate: number;
  effectiveRate: number; // with KKDF + BSMV
  monthlyPayment: number;
  totalPayment: number;
  totalInterestCost: number;
  minimumPaymentRate: number;
  riskLevel: "low" | "medium" | "high";
  warnings: string[];
  findeksImpact: string;
}

// Extended Installment Category with detailed conditions
export interface DetailedInstallmentCategory {
  id: string;
  label: string;
  icon: string;
  bireyselMax: number;
  ticariMax: number;
  minAmount?: number;
  maxAmount?: number;
  specialCondition?: string;
  isProhibited: boolean;
}

// 2026 BDDK Regulations - Extended Categories
export const DETAILED_INSTALLMENT_LIMITS: DetailedInstallmentCategory[] = [
  { id: "gida", label: "Gıda & Market", icon: "🛒", bireyselMax: 0, ticariMax: 0, isProhibited: true, specialCondition: "Taksit yasak" },
  { id: "akaryakit", label: "Akaryakıt", icon: "⛽", bireyselMax: 0, ticariMax: 0, isProhibited: true, specialCondition: "Taksit yasak" },
  { id: "telekom", label: "Telekomünikasyon", icon: "📱", bireyselMax: 0, ticariMax: 0, isProhibited: true, specialCondition: "Taksit yasak" },
  { id: "yurtdisi", label: "Yurt Dışı Harcama", icon: "✈️", bireyselMax: 0, ticariMax: 0, isProhibited: true, specialCondition: "Taksit yasak" },
  { id: "tv_elektronik", label: "Televizyon", icon: "📺", bireyselMax: 4, ticariMax: 8, minAmount: 5000, isProhibited: false, specialCondition: "5.000 TL üstü" },
  { id: "cep_telefonu", label: "Cep Telefonu (Sıfır)", icon: "📲", bireyselMax: 3, ticariMax: 6, minAmount: 12000, isProhibited: false, specialCondition: "12.000 TL üstü" },
  { id: "yenilenmis_telefon", label: "Yenilenmiş Telefon", icon: "♻️", bireyselMax: 12, ticariMax: 18, isProhibited: false, specialCondition: "Tutar sınırı yok" },
  { id: "tablet", label: "Tablet", icon: "📱", bireyselMax: 6, ticariMax: 12, isProhibited: false },
  { id: "bilgisayar", label: "Bilgisayar", icon: "💻", bireyselMax: 12, ticariMax: 18, isProhibited: false },
  { id: "mobilya", label: "Mobilya", icon: "🛋️", bireyselMax: 9, ticariMax: 18, isProhibited: false },
  { id: "beyaz_esya", label: "Beyaz Eşya", icon: "🧊", bireyselMax: 9, ticariMax: 18, isProhibited: false },
  { id: "giyim", label: "Giyim", icon: "👔", bireyselMax: 6, ticariMax: 12, isProhibited: false },
  { id: "saglik", label: "Sağlık", icon: "🏥", bireyselMax: 12, ticariMax: 18, isProhibited: false },
  { id: "egitim", label: "Eğitim", icon: "📚", bireyselMax: 12, ticariMax: 18, isProhibited: false },
  { id: "kuyum", label: "Kuyum (İşçilikli)", icon: "💍", bireyselMax: 3, ticariMax: 6, isProhibited: false },
  { id: "yurtici_seyahat", label: "Yurt İçi Seyahat", icon: "🏨", bireyselMax: 18, ticariMax: 18, isProhibited: false },
  { id: "kktc", label: "KKTC Seyahat", icon: "🇹🇷", bireyselMax: 3, ticariMax: 6, isProhibited: false },
  { id: "diger", label: "Diğer", icon: "📦", bireyselMax: 12, ticariMax: 18, isProhibited: false },
];

// 2026 BDDK Regulations
export const TAKSIT_LIMITS: TaksitLimit[] = [
  { category: "gida", maxInstallments: 0, label: "Gıda" },
  { category: "akaryakit", maxInstallments: 0, label: "Akaryakıt" },
  { category: "telekom", maxInstallments: 0, label: "Telekomünikasyon" },
  { category: "elektronik", maxInstallments: 4, minAmount: 5000, label: "Elektronik" },
  { category: "mobilya", maxInstallments: 12, label: "Mobilya" },
  { category: "giyim", maxInstallments: 6, label: "Giyim" },
  { category: "saglik", maxInstallments: 12, label: "Sağlık" },
  { category: "egitim", maxInstallments: 12, label: "Eğitim" },
  { category: "eglence", maxInstallments: 3, label: "Eğlence" },
  { category: "diger", maxInstallments: 6, label: "Diğer" },
];

export const FINANCIAL_CONSTANTS = {
  // Temel Oranlar
  TCMB_REFERENCE_RATE: 3.11, // %3.11 - TCMB referans faizi
  CASH_ADVANCE_RATE: 4.25, // %4.25 - Nakit avans faizi (sabit)
  CASH_ADVANCE_LATE_RATE: 4.55, // %4.55 - Nakit avans gecikme faizi
  KKDF_RATE: 15, // %15 - Kaynak Kullanımı Destekleme Fonu
  BSMV_RATE: 15, // %15 - BSMV for credit cards (KMH uses 5% — see KMH_CONSTANTS in familyFinance.ts)
  TRANSACTION_FEE: 1, // %1
  BANK_MARGIN: 0.5, // %0.5 banka marjı

  // 2026 Kademeli Faiz Oranları (BDDK)
  TIERED_INTEREST_RATES: {
    UNDER_30K: {
      contractual: 3.25, // Akdi faiz (dönem borcu < 30.000 TL)
      late: 3.55,        // Gecikme faizi
    },
    BETWEEN_30K_180K: {
      contractual: 3.75, // Akdi faiz (30.000 - 180.000 TL arası)
      late: 4.05,        // Gecikme faizi
    },
    OVER_180K: {
      contractual: 4.25, // Akdi faiz (dönem borcu > 180.000 TL)
      late: 4.55,        // Gecikme faizi
    },
  },

  // Asgari Ödeme Kuralları
  HIGH_LIMIT_THRESHOLD: 50000, // 50.000 TL
  HIGH_LIMIT_MIN_PAYMENT: 40, // %40
  LOW_LIMIT_MIN_PAYMENT: 20, // %20

  // Limit Kullanım Eşikleri
  UTILIZATION_WARNING_THRESHOLD: 40, // %40
  UTILIZATION_DANGER_THRESHOLD: 70, // %70

  // Limit Tahsis Kuralları (BDDK)
  LIMIT_RULES: {
    FIRST_YEAR_MULTIPLIER: 2,    // İlk yıl: Aylık gelirin 2 katı
    SECOND_YEAR_MULTIPLIER: 4,   // İkinci yıl: Aylık gelirin 4 katı
    LIMIT_REDUCTION_RANGE: { min: 400000, max: 750000 }, // Limit düşürme aralığı
    REDUCTION_DEADLINE: new Date('2026-02-15'), // 15 Şubat 2026'ya kadar
  },

  // Yapılandırma Kuralları (60 Ay BDDK)
  RESTRUCTURING_RULES: {
    MAX_TERM_MONTHS: 60,           // Maksimum 60 ay vade
    MIN_TERM_MONTHS: 6,            // Minimum 6 ay vade
    LIMIT_FREEZE_THRESHOLD: 50,    // %50 ödenmeden limit artmaz
    MAX_RATE: 3.11,                // TCMB referans faizi aşılamaz
  },

  // Eski uyumluluk için
  MAX_RESTRUCTURE_MONTHS: 60,
  MIN_RESTRUCTURE_MONTHS: 6,
  RESTRUCTURE_LIMIT_FREEZE_THRESHOLD: 50,

  // Kart Kapatma Kuralları (BDDK)
  CARD_CLOSURE_RULES: {
    YEARLY_MIN_PAYMENT_FAILS: 3,       // Yılda 3 kez asgari ödeme yapılmazsa = nakit kullanıma kapatılır
    CONSECUTIVE_MIN_PAYMENT_FAILS: 3,  // Art arda 3 kez asgari ödeme yapılmazsa = tamamen kapatılır
  },

  // Vergi Dönemleri
  TAX_DEADLINES: {
    KDV_DECLARATION_DAY: 26,           // Her ayın 26'sı KDV beyanname
    QUARTERLY_TAX_MONTHS: [1, 4, 7, 10], // Ocak, Nisan, Temmuz, Ekim
    QUARTERLY_TAX_DAY: 17,             // Geçici vergi dönem sonu
  },
};

// Bank options with brand colors
export interface BankOption {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export const BANK_OPTIONS: BankOption[] = [
  { id: "yapikredi", name: "Yapı Kredi", color: "from-blue-600 to-blue-800" },
  { id: "garanti", name: "Garanti BBVA", color: "from-emerald-600 to-emerald-800" },
  { id: "isbank", name: "İş Bankası", color: "from-violet-600 to-violet-800" },
  { id: "akbank", name: "Akbank", color: "from-rose-600 to-rose-800" },
  { id: "ziraat", name: "Ziraat Bankası", color: "from-teal-600 to-teal-800" },
  { id: "halkbank", name: "Halkbank", color: "from-sky-600 to-sky-800" },
  { id: "vakifbank", name: "Vakıfbank", color: "from-amber-600 to-amber-800" },
  { id: "qnb", name: "QNB Finansbank", color: "from-purple-600 to-purple-800" },
  { id: "denizbank", name: "Denizbank", color: "from-cyan-600 to-cyan-800" },
  { id: "teb", name: "TEB", color: "from-indigo-600 to-indigo-800" },
  { id: "ing", name: "ING", color: "from-orange-600 to-orange-800" },
  { id: "hsbc", name: "HSBC", color: "from-red-600 to-red-800" },
  // Özel Mevduat Bankaları
  { id: "sekerbank", name: "Şekerbank", color: "from-green-700 to-green-900" },
  { id: "anadolubank", name: "Anadolubank", color: "from-blue-700 to-blue-900" },
  { id: "fibabanka", name: "Fibabanka", color: "from-slate-600 to-slate-800" },
  { id: "odeabank", name: "Odeabank", color: "from-fuchsia-600 to-fuchsia-800" },
  { id: "turkishbank", name: "Turkish Bank", color: "from-stone-600 to-stone-800" },
  { id: "alternatifbank", name: "Alternatifbank", color: "from-red-700 to-red-900" },
  { id: "burganbank", name: "Burgan Bank", color: "from-yellow-600 to-yellow-800" },
  { id: "icbc", name: "ICBC Turkey", color: "from-rose-700 to-rose-900" },
  // Katılım Bankaları
  { id: "kuveytturk", name: "Kuveyt Türk", color: "from-emerald-700 to-emerald-900" },
  { id: "turkiyefinans", name: "Türkiye Finans", color: "from-green-600 to-green-800" },
  { id: "albaraka", name: "Albaraka Türk", color: "from-teal-700 to-teal-900" },
  { id: "ziraatkatilim", name: "Ziraat Katılım", color: "from-lime-700 to-lime-900" },
  { id: "vakifkatilim", name: "Vakıf Katılım", color: "from-amber-700 to-amber-900" },
  { id: "emlakkatilim", name: "Emlak Katılım", color: "from-cyan-700 to-cyan-900" },
  { id: "hayatfinans", name: "Hayat Finans", color: "from-sky-700 to-sky-900" },
  // Dijital Bankalar / Fintek
  { id: "enpara", name: "Enpara.com", color: "from-violet-600 to-violet-800" },
  { id: "papara", name: "Papara", color: "from-purple-500 to-purple-700" },
  { id: "diger", name: "Diğer", color: "from-gray-600 to-gray-800" },
];

// Card form input type
export interface CardFormInput {
  bankId: string;
  cardName: string;
  lastFourDigits: string;
  cardType: "bireysel" | "ticari";
  limit: number;
  currentDebt: number;
  statementDate: number;
  interestRate: number;
}
