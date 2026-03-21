import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
 
// Only import Turkish (default) statically - other languages loaded on demand
import trCommon from './locales/tr/common.json';
import trSettings from './locales/tr/settings.json';
import trCards from './locales/tr/cards.json';
import trFinance from './locales/tr/finance.json';
import trFamily from './locales/tr/family.json';
import trInvestments from './locales/tr/investments.json';
import trLoans from './locales/tr/loans.json';
import trAssets from './locales/tr/assets.json';
import trNotifications from './locales/tr/notifications.json';
import trSubscription from './locales/tr/subscription.json';
import trFaq from './locales/tr/faq.json';
import trOnboarding from './locales/tr/onboarding.json';
import trWidgets from './locales/tr/widgets.json';
import trAi from './locales/tr/ai.json';
 
export const defaultNS = 'common';
export const namespaces = [
  'common', 'settings', 'cards', 'finance', 'family',
  'investments', 'loans', 'assets', 'notifications',
  'subscription', 'faq', 'onboarding', 'widgets', 'ai',
] as const;
 
export type AppNamespace = (typeof namespaces)[number];
 
type LangCode = 'en' | 'ar' | 'ru' | 'uk';
 
const langLoaders: Record<LangCode, () => Promise<Record<string, unknown>>> = {
  en: () => import('./locales/en/_bundle').then(m => m.default),
  ar: () => import('./locales/ar/_bundle').then(m => m.default),
  ru: () => import('./locales/ru/_bundle').then(m => m.default),
  uk: () => import('./locales/uk/_bundle').then(m => m.default),
};
 
const loadedLanguages = new Set<string>(['tr']);
 
export async function loadLanguage(lang: string): Promise<void> {
  if (loadedLanguages.has(lang)) return;
  const loader = langLoaders[lang as LangCode];
  if (!loader) return;
 
  const bundle = await loader();
  for (const ns of namespaces) {
    if (bundle[ns]) {
      i18n.addResourceBundle(lang, ns, bundle[ns], true, true);
    }
  }
  loadedLanguages.add(lang);
}
 
i18n.use(initReactI18next).init({
  resources: {
    tr: {
      common: trCommon,
      settings: trSettings,
      cards: trCards,
      finance: trFinance,
      family: trFamily,
      investments: trInvestments,
      loans: trLoans,
      assets: trAssets,
      notifications: trNotifications,
      subscription: trSubscription,
      faq: trFaq,
      onboarding: trOnboarding,
      widgets: trWidgets,
      ai: trAi,
    },
  },
  lng: 'tr',
  fallbackLng: 'tr',
  defaultNS,
  ns: namespaces as unknown as string[],
  interpolation: {
    escapeValue: false,
  },
});
 
export default i18n;
 