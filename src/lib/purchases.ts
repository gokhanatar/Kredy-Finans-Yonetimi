/**
 * Subscription utilities
 * Screenshot mode + local trial + legacy migration
 */

const SCREENSHOT_MODE_KEY = 'kredi-pusula-screenshot-mode';
const TRIAL_END_KEY = 'kredi-pusula-trial-end';
const TRIAL_STARTED_KEY = 'kredi-pusula-trial-started';

export const TRIAL_DAYS = 7;

/**
 * One-time migration: if NESALPDENIZ2016 promo was previously used,
 * convert it to screenshot mode flag and clean up old promo keys.
 */
export function migratePromoToScreenshotMode(): void {
  try {
    if (localStorage.getItem(SCREENSHOT_MODE_KEY) !== null) return;

    const usedRaw = localStorage.getItem('kredi-pusula-promo-used');
    if (usedRaw) {
      const used: string[] = JSON.parse(usedRaw);
      if (used.includes('NESALPDENIZ2016')) {
        localStorage.setItem(SCREENSHOT_MODE_KEY, 'true');
      }
    }

    localStorage.removeItem('kredi-pusula-promo');
    localStorage.removeItem('kredi-pusula-promo-used');
  } catch {
    // Ignore
  }
}

export function isScreenshotMode(): boolean {
  return localStorage.getItem(SCREENSHOT_MODE_KEY) === 'true';
}

export function startTrial(): void {
  const end = new Date();
  end.setDate(end.getDate() + TRIAL_DAYS);
  localStorage.setItem(TRIAL_END_KEY, end.toISOString());
  localStorage.setItem(TRIAL_STARTED_KEY, new Date().toISOString());
}

export function getTrialInfo(): { isActive: boolean; daysLeft: number; endDate: Date | null } {
  const trialEnd = localStorage.getItem(TRIAL_END_KEY);
  if (!trialEnd) {
    return { isActive: false, daysLeft: 0, endDate: null };
  }

  const endDate = new Date(trialEnd);
  const diff = endDate.getTime() - Date.now();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return {
    isActive: daysLeft > 0,
    daysLeft: Math.max(0, daysLeft),
    endDate,
  };
}

export function hasUsedTrial(): boolean {
  return !!localStorage.getItem(TRIAL_STARTED_KEY);
}
