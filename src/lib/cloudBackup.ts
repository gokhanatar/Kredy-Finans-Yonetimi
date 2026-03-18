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

/**
 * Check if local data is newer than the backup being restored.
 * Returns true if local is newer (restore would overwrite newer data).
 */
export function isLocalNewerThanBackup(backup: CloudBackupData): boolean {
  const localTs = getLocalTimestamp();
  if (!localTs) return false;
  return new Date(localTs).getTime() > new Date(backup.timestamp).getTime();
}

export function restoreLocalData(backup: CloudBackupData): void {
  const allowedKeys = new Set(ALL_STORAGE_KEYS);
  for (const [key, value] of Object.entries(backup.data)) {
    if (value !== null && value !== undefined && allowedKeys.has(key)) {
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
