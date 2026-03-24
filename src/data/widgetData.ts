export type WidgetSize = '1x1' | '2x1' | '2x2';
export type WidgetCategory = 'ciddi' | 'komik' | 'eglenceli';

export interface WidgetDef {
  id: string;
  nameKey: string;
  descKey: string;
  category: WidgetCategory;
  size: WidgetSize;
  gradient: string;
  icon: string;
  preview: WidgetPreviewData;
}

export interface WidgetPreviewData {
  type: 'debt' | 'payment' | 'golden' | 'budget' | 'barometer' | 'salary' | 'quotes' | 'savings' | 'tip' | 'findeks' | 'bank-account';
}

export const CATEGORY_LABEL_KEYS: Record<WidgetCategory, string> = {
  ciddi: 'widgets:categories.ciddi',
  komik: 'widgets:categories.komik',
  eglenceli: 'widgets:categories.eglenceli',
};

export const QUOTE_COUNT = 8;

export const TIP_COUNT = 8;

export const BAROMETER_LEVELS = [
  { min: 0, max: 20, emoji: 'smile', labelKey: 'widgets:barometer.levels.0' },
  { min: 20, max: 40, emoji: 'smile', labelKey: 'widgets:barometer.levels.20' },
  { min: 40, max: 60, emoji: 'meh', labelKey: 'widgets:barometer.levels.40' },
  { min: 60, max: 80, emoji: 'frown', labelKey: 'widgets:barometer.levels.60' },
  { min: 80, max: 100, emoji: 'flame', labelKey: 'widgets:barometer.levels.80' },
];

export const widgets: WidgetDef[] = [
  {
    id: 'debt-status',
    nameKey: 'widgets:widgets.debt-status.name',
    descKey: 'widgets:widgets.debt-status.description',
    category: 'ciddi',
    size: '1x1',
    gradient: 'from-red-500/30 via-rose-500/20 to-pink-500/10',
    icon: 'credit-card',
    preview: { type: 'debt' },
  },
  {
    id: 'payment-reminder',
    nameKey: 'widgets:widgets.payment-reminder.name',
    descKey: 'widgets:widgets.payment-reminder.description',
    category: 'ciddi',
    size: '2x1',
    gradient: 'from-blue-500/30 via-indigo-500/20 to-violet-500/10',
    icon: 'clock',
    preview: { type: 'payment' },
  },
  {
    id: 'golden-window',
    nameKey: 'widgets:widgets.golden-window.name',
    descKey: 'widgets:widgets.golden-window.description',
    category: 'ciddi',
    size: '1x1',
    gradient: 'from-amber-400/35 via-yellow-400/25 to-orange-400/10',
    icon: 'sparkles',
    preview: { type: 'golden' },
  },
  {
    id: 'budget-status',
    nameKey: 'widgets:widgets.budget-status.name',
    descKey: 'widgets:widgets.budget-status.description',
    category: 'ciddi',
    size: '2x1',
    gradient: 'from-emerald-500/30 via-green-500/20 to-teal-500/10',
    icon: 'bar-chart',
    preview: { type: 'budget' },
  },
  {
    id: 'wallet-barometer',
    nameKey: 'widgets:widgets.wallet-barometer.name',
    descKey: 'widgets:widgets.wallet-barometer.description',
    category: 'komik',
    size: '1x1',
    gradient: 'from-purple-500/30 via-violet-500/20 to-fuchsia-500/10',
    icon: 'thermometer',
    preview: { type: 'barometer' },
  },
  {
    id: 'salary-countdown',
    nameKey: 'widgets:widgets.salary-countdown.name',
    descKey: 'widgets:widgets.salary-countdown.description',
    category: 'komik',
    size: '1x1',
    gradient: 'from-pink-500/30 via-rose-500/20 to-red-500/10',
    icon: 'coins',
    preview: { type: 'salary' },
  },
  {
    id: 'money-quotes',
    nameKey: 'widgets:widgets.money-quotes.name',
    descKey: 'widgets:widgets.money-quotes.description',
    category: 'komik',
    size: '2x1',
    gradient: 'from-orange-500/30 via-amber-500/20 to-yellow-500/10',
    icon: 'message-square',
    preview: { type: 'quotes' },
  },
  {
    id: 'savings-goal',
    nameKey: 'widgets:widgets.savings-goal.name',
    descKey: 'widgets:widgets.savings-goal.description',
    category: 'eglenceli',
    size: '2x1',
    gradient: 'from-teal-500/30 via-cyan-500/20 to-sky-500/10',
    icon: 'target',
    preview: { type: 'savings' },
  },
  {
    id: 'daily-tip',
    nameKey: 'widgets:widgets.daily-tip.name',
    descKey: 'widgets:widgets.daily-tip.description',
    category: 'eglenceli',
    size: '2x1',
    gradient: 'from-sky-500/30 via-blue-500/20 to-indigo-500/10',
    icon: 'lightbulb',
    preview: { type: 'tip' },
  },
  {
    id: 'findeks-score',
    nameKey: 'widgets:widgets.findeks-score.name',
    descKey: 'widgets:widgets.findeks-score.description',
    category: 'eglenceli',
    size: '1x1',
    gradient: 'from-lime-500/30 via-green-500/20 to-emerald-500/10',
    icon: 'trending-up',
    preview: { type: 'findeks' },
  },
  {
    id: 'bank-account',
    nameKey: 'widgets:widgets.bank-account.name',
    descKey: 'widgets:widgets.bank-account.description',
    category: 'ciddi',
    size: '2x1',
    gradient: 'from-slate-500/30 via-gray-500/20 to-zinc-500/10',
    icon: 'building-2',
    preview: { type: 'bank-account' },
  },
];
