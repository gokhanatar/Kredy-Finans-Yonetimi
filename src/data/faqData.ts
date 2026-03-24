// FAQ structure - text comes from i18n translation files (faq.json)

export interface FAQCategoryDef {
  id: string;
  icon: string;
  questionCount: number;
}

export const FAQ_CATEGORIES: FAQCategoryDef[] = [
  { id: 'genel', icon: 'smartphone', questionCount: 4 },
  { id: 'faiz', icon: 'bar-chart', questionCount: 5 },
  { id: 'bddk', icon: 'clipboard-list', questionCount: 4 },
  { id: 'kredi', icon: 'landmark', questionCount: 3 },
  { id: 'bildirim', icon: 'bell', questionCount: 3 },
  { id: 'vergi', icon: 'calendar', questionCount: 3 },
  { id: 'yatirim', icon: 'trending-up', questionCount: 3 },
  { id: 'varlik', icon: 'house', questionCount: 3 },
  { id: 'aile', icon: 'users', questionCount: 3 },
  { id: 'guvenlik', icon: 'shield', questionCount: 3 },
  { id: 'premium', icon: 'star', questionCount: 5 },
  { id: 'kmh', icon: 'building-2', questionCount: 4 },
];

export interface GuideSectionDef {
  id: string;
  icon: string;
  itemCount: number;
}

export const GUIDE_SECTIONS: GuideSectionDef[] = [
  { id: 'quickStart', icon: 'rocket', itemCount: 6 },
  { id: 'cardManagement', icon: 'credit-card', itemCount: 5 },
  { id: 'goldenWindow', icon: 'clock', itemCount: 3 },
  { id: 'paymentCalendar', icon: 'calendar', itemCount: 3 },
  { id: 'healthScore', icon: 'bar-chart', itemCount: 4 },
  { id: 'loanSimulator', icon: 'landmark', itemCount: 4 },
  { id: 'debtTools', icon: 'calculator', itemCount: 3 },
  { id: 'personalFinance', icon: 'wallet', itemCount: 5 },
  { id: 'familyFinance', icon: 'users', itemCount: 4 },
  { id: 'investments', icon: 'trending-up', itemCount: 4 },
  { id: 'assetManagement', icon: 'house', itemCount: 4 },
  { id: 'commercialAnalytics', icon: 'receipt', itemCount: 3 },
  { id: 'notifications', icon: 'bell', itemCount: 3 },
  { id: 'widgets', icon: 'gem', itemCount: 2 },
  { id: 'accountSettings', icon: 'settings', itemCount: 6 },
  { id: 'premium', icon: 'star', itemCount: 5 },
  { id: 'kmh', icon: 'building-2', itemCount: 4 },
];

export const CONTACT_INFO = {
  email: 'destek@kredipusula.com',
  phone: '+90 850 123 45 67',
};

export const APP_INFO = {
  version: '2.1.0',
  lastUpdate: '2026-02-02',
  developer: 'Kredy',
};
