// Cloud Backup - Save/restore all app data to Firebase RTDB under user's UID
// Uses REST API for WKWebView compatibility (no WebSocket dependency)

export const ALL_STORAGE_KEYS = [
  'kredi-pusula-user-profile',
  'kredi-pusula-cards',
  'kredi-pusula-loans',
  'kredi-pusula-purchases',
  'kredi-pusula-assets',
  'kredi-pusula-notification-settings',
  'kredi-pusula-investments',
  'kredi-pusula-loan-payments',
  'kredi-pusula-accounts',
  'kredi-pusula-family-transactions',
  'kredi-pusula-subscriptions',
  'kredi-pusula-recurring-expenses',
  'kredi-pusula-budgets',
  'kredi-pusula-goals',
  'kredi-pusula-shared-wallets',
  'kredi-pusula-networth-history',
  'kredi-pusula-privacy-mode',
  'kredi-pusula-currency-rates',
  'kredi-pusula-category-limits',
  'kredi-pusula-investment-prices',
  'kredi-pusula-recurring-incomes',
  'kredi-pusula-properties',
  'kredi-pusula-vehicles',
  'kredi-pusula-monthly-bills',
  'kredi-pusula-personal-accounts',
  'kredi-pusula-personal-monthly-bills',
  'kredi-pusula-personal-transactions',
  'kredi-pusula-personal-subscriptions',
  'kredi-pusula-personal-recurring-expenses',
  'kredi-pusula-personal-budgets',
  'kredi-pusula-personal-goals',
  'kredi-pusula-notification-inbox',
  'kredi-pusula-family-cards',
  'kredi-pusula-businesses',
  'kredi-pusula-iap-subscription',
  'kredi-pusula-simple-mode',
];

const LOCAL_MODIFIED_KEY = 'kredi-pusula-local-modified';

export interface CloudBackupData {
  version: number;
  timestamp: string;
  data: Record<string, string | null>;
}

export function getLocalTimestamp(): string | null {
  return localStorage.getItem(LOCAL_MODIFIED_KEY);
}

export function setLocalTimestamp(ts?: string): void {
  localStorage.setItem(LOCAL_MODIFIED_KEY, ts || new Date().toISOString());
}

export function collectLocalData(): CloudBackupData {
  const data: Record<string, string | null> = {};
  for (const key of ALL_STORAGE_KEYS) {
    data[key] = localStorage.getItem(key);
  }
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    data,
  };
}

export function restoreLocalData(backup: CloudBackupData): void {
  for (const [key, value] of Object.entries(backup.data)) {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, value);
    }
  }
  // Set local timestamp to cloud timestamp to prevent immediate re-backup
  setLocalTimestamp(backup.timestamp);
}

export async function saveToCloud(uid: string): Promise<void> {
  const { restSet } = await import('./firebase');
  const backup = collectLocalData();
  await restSet(`backups/${uid}`, backup);
}

export async function loadFromCloud(uid: string): Promise<CloudBackupData | null> {
  const { restGet } = await import('./firebase');
  const data = await restGet(`backups/${uid}`) as CloudBackupData | null;
  return data;
}

export async function getBackupTimestamp(uid: string): Promise<string | null> {
  const { restGet } = await import('./firebase');
  const ts = await restGet(`backups/${uid}/timestamp`) as string | null;
  return ts;
}
