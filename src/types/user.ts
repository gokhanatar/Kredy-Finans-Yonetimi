// Kullanıcı Profil Tipleri

export interface UserProfile {
  name: string;
  email: string;
  monthlyIncome?: number;
  preferredCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'RUB' | 'SAR' | 'AED' | 'IQD';
  theme: 'light' | 'dark' | 'sepia' | 'system' | 'elderly' | 'girls' | 'high-contrast' | 'corporate';
  language: 'tr' | 'en' | 'ar' | 'ru' | 'uk';
  
  // Finansal tercihler
  defaultReminderDays: number;
  preferredNotificationTime: { hour: number; minute: number };

  // Navigasyon tercihleri
  hidePersonalFinance?: boolean;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Kullanıcı',
  email: '',
  monthlyIncome: undefined,
  preferredCurrency: 'TRY',
  theme: 'system',
  language: 'tr',
  defaultReminderDays: 3,
  preferredNotificationTime: { hour: 9, minute: 0 },
};

export const CURRENCY_SYMBOLS: Record<UserProfile['preferredCurrency'], string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  SAR: '﷼',
  AED: 'د.إ',
  IQD: 'د.ع',
};

export const THEME_LABELS: Record<UserProfile['theme'], string> = {
  light: 'Açık',
  dark: 'Koyu',
  sepia: 'Okuma Modu',
  system: 'Sistem',
  elderly: 'Kolay Okuma',
  girls: 'Pembe',
  'high-contrast': 'Yüksek Kontrast',
  corporate: 'Kurumsal',
};

export const LANGUAGE_LABELS: Record<UserProfile['language'], string> = {
  tr: 'Türkçe',
  en: 'English',
  ar: 'العربية',
  ru: 'Русский',
  uk: 'Українська',
};
