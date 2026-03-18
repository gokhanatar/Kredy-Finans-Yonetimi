// Aile Finansı Tip Tanımları

// ============= HESAP TİPLERİ =============

export type AccountType = 'bank' | 'cash' | 'digital' | 'investment';
export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: CurrencyCode;
  icon: string;
  color: string;
  bankName?: string;
  isActive: boolean;
  // KMH (Kredili Mevduat Hesabı) fields
  kmhEnabled?: boolean;
  kmhLimit?: number;
  kmhInterestRate?: number;    // aylık akdi faiz oranı (%)
  kmhDefaultRate?: number;     // aylık temerrüt faiz oranı (%)
  kmhLastNegativeDate?: string; // ISO string - bakiye negatife düştüğü tarih
  kmhAccruedInterest?: number;  // birikmiş faiz
  monthlyIncome?: number;       // KMH limit doğrulaması için
  iban?: string;
  lastFourDigits?: string;
}

// ============= KMH SABİTLERİ =============

export const KMH_CONSTANTS = {
  // TCMB Ocak 2026 oranları
  DEFAULT_INTEREST_RATE: 4.25,   // %4.25/ay akdi faiz
  DEFAULT_DEFAULT_RATE: 4.55,    // %4.55/ay temerrüt faiz
  // Vergiler
  KKDF_RATE: 0.15,              // %15 KKDF
  BSMV_RATE: 0.05,              // %5 BSMV (KMH-specific rate per BDDK; credit cards use 15% — see finance.ts)
  TAX_MULTIPLIER: 1.20,         // 1 + KKDF + BSMV = 1.20
  // BDDK kuralı
  MAX_INCOME_MULTIPLIER: 2,     // KMH limiti max aylık gelirin 2 katı
  // Severity thresholds
  SEVERITY_LOW: 0.25,           // %25 altı - düşük risk
  SEVERITY_MEDIUM: 0.50,        // %50 altı - orta risk
  SEVERITY_HIGH: 0.75,          // %75 altı - yüksek risk
  // %75+ kritik
} as const;

// ============= GELİR/GİDER İŞLEMLERİ =============

export type TransactionType = 'income' | 'expense';

export type FamilyTransactionCategory =
  | 'maas' | 'ek-gelir' | 'kira-gelir' | 'yatirim-gelir' | 'diger-gelir'  // gelir
  | 'market' | 'kira' | 'fatura' | 'ulasim' | 'saglik' | 'egitim'         // gider
  | 'eglence' | 'giyim' | 'yemek' | 'ev' | 'cocuk' | 'evcil'
  | 'bakim' | 'hediye' | 'tasit' | 'sigorta' | 'diger-gider';

export interface FamilyTransaction {
  id: string;
  accountId?: string;
  type: TransactionType;
  amount: number;
  category: FamilyTransactionCategory;
  description: string;
  date: string; // ISO string
  currency: CurrencyCode;
  receiptPhoto?: string; // base64 data URL
  isRecurring?: boolean;
  recurringExpenseId?: string;
  subscriptionId?: string;
  createdBy?: string; // memberId — for family transaction limit tracking
  cardId?: string;           // hangi kartla ödendi (opsiyonel)
  installments?: number;     // kaç taksit (opsiyonel, 1 = tek çekim)
}

export const INCOME_CATEGORIES: { id: FamilyTransactionCategory; label: string; icon: string }[] = [
  { id: 'maas', label: 'Maaş', icon: 'coins' },
  { id: 'ek-gelir', label: 'Ek Gelir', icon: 'banknote' },
  { id: 'kira-gelir', label: 'Kira Geliri', icon: 'home' },
  { id: 'yatirim-gelir', label: 'Yatırım Geliri', icon: 'trending-up' },
  { id: 'diger-gelir', label: 'Diğer Gelir', icon: 'gem' },
];

export const EXPENSE_CATEGORIES: { id: FamilyTransactionCategory; label: string; icon: string }[] = [
  { id: 'market', label: 'Market', icon: 'shopping-cart' },
  { id: 'kira', label: 'Kira', icon: 'home' },
  { id: 'fatura', label: 'Fatura', icon: 'file-text' },
  { id: 'ulasim', label: 'Ulaşım', icon: 'bus' },
  { id: 'saglik', label: 'Sağlık', icon: 'heart-pulse' },
  { id: 'egitim', label: 'Eğitim', icon: 'graduation-cap' },
  { id: 'eglence', label: 'Eğlence', icon: 'film' },
  { id: 'giyim', label: 'Giyim', icon: 'shirt' },
  { id: 'yemek', label: 'Yemek', icon: 'utensils-crossed' },
  { id: 'ev', label: 'Ev & Dekorasyon', icon: 'armchair' },
  { id: 'cocuk', label: 'Çocuk', icon: 'baby' },
  { id: 'evcil', label: 'Evcil Hayvan', icon: 'paw-print' },
  { id: 'bakim', label: 'Kişisel Bakım', icon: 'sparkles' },
  { id: 'hediye', label: 'Hediye', icon: 'gift' },
  { id: 'tasit', label: 'Taşıt', icon: 'car' },
  { id: 'sigorta', label: 'Sigorta', icon: 'shield' },
  { id: 'diger-gider', label: 'Diğer', icon: 'package' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

// ============= ABONELİKLER =============

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export type SubscriptionCategory =
  | 'dijital' | 'muzik' | 'video' | 'oyun' | 'bulut'
  | 'spor' | 'egitim-abo' | 'haber' | 'yazilim' | 'diger-abo';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  billingDate: number; // day of month (1-31)
  category: SubscriptionCategory;
  isActive: boolean;
  icon: string;
  startDate: string;
  notes?: string;
}

export const SUBSCRIPTION_CATEGORIES: { id: SubscriptionCategory; label: string; icon: string }[] = [
  { id: 'dijital', label: 'Dijital Hizmet', icon: 'smartphone' },
  { id: 'muzik', label: 'Müzik', icon: 'music' },
  { id: 'video', label: 'Video/Film', icon: 'film' },
  { id: 'oyun', label: 'Oyun', icon: 'gamepad-2' },
  { id: 'bulut', label: 'Bulut Depolama', icon: 'cloud' },
  { id: 'spor', label: 'Spor/Salon', icon: 'dumbbell' },
  { id: 'egitim-abo', label: 'Eğitim', icon: 'graduation-cap' },
  { id: 'haber', label: 'Haber/Dergi', icon: 'newspaper' },
  { id: 'yazilim', label: 'Yazılım', icon: 'laptop' },
  { id: 'diger-abo', label: 'Diğer', icon: 'package' },
];

export const POPULAR_SUBSCRIPTIONS: { name: string; icon: string; category: SubscriptionCategory }[] = [
  { name: 'Netflix', icon: 'film', category: 'video' },
  { name: 'Spotify', icon: 'music', category: 'muzik' },
  { name: 'YouTube Premium', icon: 'play', category: 'video' },
  { name: 'Apple Music', icon: 'music', category: 'muzik' },
  { name: 'Disney+', icon: 'film', category: 'video' },
  { name: 'Amazon Prime', icon: 'package', category: 'dijital' },
  { name: 'PlayStation Plus', icon: 'gamepad-2', category: 'oyun' },
  { name: 'Xbox Game Pass', icon: 'gamepad-2', category: 'oyun' },
  { name: 'iCloud', icon: 'cloud', category: 'bulut' },
  { name: 'Google One', icon: 'cloud', category: 'bulut' },
  { name: 'ChatGPT Plus', icon: 'bot', category: 'yazilim' },
  { name: 'Gym/Spor Salonu', icon: 'dumbbell', category: 'spor' },
];

// ============= TEKRARLAYAN GİDERLER =============

export interface RecurringExpense {
  id: string;
  name: string;
  dailyAmount: number;
  currency: CurrencyCode;
  activeDays: number[]; // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
  category: FamilyTransactionCategory;
  isActive: boolean;
  startDate: string;
  icon: string;
  notes?: string;
}

export const RECURRING_EXPENSE_PRESETS: { name: string; icon: string; category: FamilyTransactionCategory; defaultDays: number[] }[] = [
  { name: 'Yol/Ulaşım', icon: 'bus', category: 'ulasim', defaultDays: [1, 2, 3, 4, 5] },
  { name: 'Sigara', icon: 'cigarette', category: 'diger-gider', defaultDays: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Kahve', icon: 'coffee', category: 'yemek', defaultDays: [1, 2, 3, 4, 5] },
  { name: 'Öğle Yemeği', icon: 'utensils-crossed', category: 'yemek', defaultDays: [1, 2, 3, 4, 5] },
  { name: 'Akaryakıt', icon: 'fuel', category: 'tasit', defaultDays: [1, 2, 3, 4, 5] },
  { name: 'Otopark', icon: 'circle-parking', category: 'tasit', defaultDays: [1, 2, 3, 4, 5] },
];

export const DAY_LABELS = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

// ============= SİSTEMATİK GELİRLER =============

export type IncomeFrequency = 'monthly' | 'weekly' | 'biweekly' | 'yearly' | 'one-time';

export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  category: FamilyTransactionCategory;
  frequency: IncomeFrequency;
  dayOfMonth?: number;
  isActive: boolean;
  startDate: string;
  icon: string;
  notes?: string;
}

export const INCOME_FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  monthly: 'Aylık',
  weekly: 'Haftalık',
  biweekly: 'İki Haftada Bir',
  yearly: 'Yıllık',
  'one-time': 'Tek Seferlik',
};

export const RECURRING_INCOME_PRESETS: { name: string; icon: string; category: FamilyTransactionCategory; frequency: IncomeFrequency }[] = [
  { name: 'Maaş', icon: 'coins', category: 'maas', frequency: 'monthly' },
  { name: 'Kira Geliri', icon: 'home', category: 'kira-gelir', frequency: 'monthly' },
  { name: 'Freelance / Ek İş', icon: 'briefcase', category: 'ek-gelir', frequency: 'monthly' },
  { name: 'Yatırım Geliri / Faiz', icon: 'trending-up', category: 'yatirim-gelir', frequency: 'monthly' },
  { name: 'Emekli Maaşı', icon: 'user-round', category: 'maas', frequency: 'monthly' },
  { name: 'Burs / Destek', icon: 'graduation-cap', category: 'diger-gelir', frequency: 'monthly' },
];

// ============= BÜTÇE (SIFIR TABANLI) =============

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  icon: string;
  color: string;
}

export interface Budget {
  id: string;
  month: number; // 0-11
  year: number;
  totalIncome: number;
  categories: BudgetCategory[];
}

export const DEFAULT_BUDGET_CATEGORIES: Omit<BudgetCategory, 'id' | 'allocated' | 'spent'>[] = [
  { name: 'Kira', icon: 'home', color: 'bg-blue-500' },
  { name: 'Market', icon: 'shopping-cart', color: 'bg-green-500' },
  { name: 'Fatura', icon: 'file-text', color: 'bg-yellow-500' },
  { name: 'Ulaşım', icon: 'bus', color: 'bg-orange-500' },
  { name: 'Yemek', icon: 'utensils-crossed', color: 'bg-red-500' },
  { name: 'Eğlence', icon: 'film', color: 'bg-purple-500' },
  { name: 'Sağlık', icon: 'heart-pulse', color: 'bg-pink-500' },
  { name: 'Giyim', icon: 'shirt', color: 'bg-indigo-500' },
  { name: 'Tasarruf', icon: 'coins', color: 'bg-emerald-500' },
  { name: 'Diğer', icon: 'package', color: 'bg-gray-500' },
];

// ============= HEDEFLER =============

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  deadline?: string; // ISO date
  icon: string;
  color: string;
  contributions: GoalContribution[];
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export const GOAL_ICONS = ['home', 'car', 'plane', 'smartphone', 'laptop', 'graduation-cap', 'gem', 'baby', 'palmtree', 'coins', 'target', 'star'];
export const GOAL_COLORS = [
  'from-blue-500 to-blue-700',
  'from-green-500 to-green-700',
  'from-purple-500 to-purple-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-teal-500 to-teal-700',
];

// ============= ORTAK CÜZDAN =============

export type SplitType = 'equal' | 'custom' | 'percentage';

export interface SharedTransaction {
  id: string;
  walletId: string;
  paidBy: string;
  amount: number;
  description: string;
  date: string;
  splitType: SplitType;
  splits?: { member: string; amount: number }[];
}

export interface SharedWallet {
  id: string;
  name: string;
  members: string[];
  transactions: SharedTransaction[];
  currency: CurrencyCode;
  icon: string;
}

// ============= NET DEĞER =============

export interface NetWorthSnapshot {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

// ============= KATEGORİ LİMİTLERİ =============

export interface CategorySpendingLimit {
  categoryId: FamilyTransactionCategory;
  monthlyLimit: number;
  alertThreshold: number; // percentage (0-100)
}

// ============= DÖVİZ KURLARI =============

export interface CurrencyRates {
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  lastUpdated: string;
}

// ============= TEKRARLAYAN FATURALAR =============

export type BillFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringBill {
  id: string;
  name: string;
  frequency: BillFrequency;
  dayOfMonth?: number;        // frequency=monthly (1-31)
  dayOfWeek?: number;         // frequency=weekly (0-6)
  isFixedAmount: boolean;
  fixedAmount?: number;
  lastPaidAmount?: number;
  category: FamilyTransactionCategory;
  currency: CurrencyCode;
  isActive: boolean;
  icon: string;
  notes?: string;
  history: BillPayment[];
}

export interface BillPayment {
  id: string;
  amount: number;
  date: string;
  isPaid: boolean;
}

export const RECURRING_BILL_PRESETS: { name: string; icon: string; category: FamilyTransactionCategory; isFixed: boolean; frequency: BillFrequency }[] = [
  { name: 'Kira', icon: 'home', category: 'kira', isFixed: true, frequency: 'monthly' },
  { name: 'Elektrik', icon: 'zap', category: 'fatura', isFixed: false, frequency: 'monthly' },
  { name: 'Su', icon: 'droplets', category: 'fatura', isFixed: false, frequency: 'monthly' },
  { name: 'Doğalgaz', icon: 'flame', category: 'fatura', isFixed: false, frequency: 'monthly' },
  { name: 'İnternet', icon: 'wifi', category: 'fatura', isFixed: true, frequency: 'monthly' },
  { name: 'Telefon Hattı', icon: 'smartphone', category: 'fatura', isFixed: true, frequency: 'monthly' },
  { name: 'Aidat', icon: 'building-2', category: 'kira', isFixed: true, frequency: 'monthly' },
  { name: 'Sigorta', icon: 'shield', category: 'sigorta', isFixed: true, frequency: 'monthly' },
  { name: 'Haftalık Temizlik', icon: 'sparkles', category: 'ev', isFixed: true, frequency: 'weekly' },
  { name: 'Kahve', icon: 'coffee', category: 'yemek', isFixed: true, frequency: 'daily' },
  { name: 'Ulaşım', icon: 'bus', category: 'ulasim', isFixed: true, frequency: 'daily' },
];

// ============= STORAGE KEYS =============

export const FAMILY_STORAGE_KEYS = {
  ACCOUNTS: 'kredi-pusula-accounts',
  TRANSACTIONS: 'kredi-pusula-family-transactions',
  SUBSCRIPTIONS: 'kredi-pusula-subscriptions',
  RECURRING_EXPENSES: 'kredi-pusula-recurring-expenses',
  BUDGETS: 'kredi-pusula-budgets',
  GOALS: 'kredi-pusula-goals',
  SHARED_WALLETS: 'kredi-pusula-shared-wallets',
  NETWORTH_HISTORY: 'kredi-pusula-networth-history',
  PRIVACY_MODE: 'kredi-pusula-privacy-mode',
  CURRENCY_RATES: 'kredi-pusula-currency-rates',
  CATEGORY_LIMITS: 'kredi-pusula-category-limits',
  RECURRING_INCOMES: 'kredi-pusula-recurring-incomes',
  MONTHLY_BILLS: 'kredi-pusula-monthly-bills',
} as const;

export const PERSONAL_STORAGE_KEYS = {
  ACCOUNTS: 'kredi-pusula-personal-accounts',
  TRANSACTIONS: 'kredi-pusula-personal-transactions',
  SUBSCRIPTIONS: 'kredi-pusula-personal-subscriptions',
  RECURRING_EXPENSES: 'kredi-pusula-personal-recurring-expenses',
  BUDGETS: 'kredi-pusula-personal-budgets',
  GOALS: 'kredi-pusula-personal-goals',
  SHARED_WALLETS: 'kredi-pusula-personal-shared-wallets',
  NETWORTH_HISTORY: 'kredi-pusula-personal-networth-history',
  RECURRING_INCOMES: 'kredi-pusula-personal-recurring-incomes',
  MONTHLY_BILLS: 'kredi-pusula-personal-monthly-bills',
} as const;
