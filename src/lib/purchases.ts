
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
 