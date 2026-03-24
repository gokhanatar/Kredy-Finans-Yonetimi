/**
 * Notification Bridge
 * Capacitor LocalNotification listener'lari → CustomEvent koprusu.
 * React hook'lari disinda Capacitor event'lerini yakalar,
 * inbox'a eklemek icin CustomEvent dispatch eder.
 */

import { Capacitor } from '@capacitor/core';
import { playNotificationSound, type SoundGroup } from './notificationSoundService';
import type { NotificationType, NotificationSeverity } from '@/hooks/useNotificationInbox';

export const NOTIFICATION_INBOX_ADD = 'notification-inbox-add';
export const NOTIFICATION_TAP_NAV = 'notification-tap-navigate';

export interface NotificationInboxPayload {
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  notificationId: number;
  assetType?: 'card' | 'loan' | 'bill';
  assetId?: string;
}

function extractAssetMeta(extra: any): { assetType?: 'card' | 'loan' | 'bill'; assetId?: string } {
  if (!extra) return {};
  if (extra.cardId) return { assetType: 'card', assetId: extra.cardId };
  if (extra.loanId) return { assetType: 'loan', assetId: extra.loanId };
  if (extra.billId) return { assetType: 'bill', assetId: extra.billId };
  return {};
}

// actionTypeId → inbox type + severity + soundGroup mapping
const ACTION_TYPE_MAP: Record<string, { type: NotificationType; severity: NotificationSeverity; soundGroup: SoundGroup }> = {
  // positive — Pozitif / Firsat
  'golden-window':         { type: 'golden',        severity: 'info',    soundGroup: 'positive' },
  'goal-reminder':         { type: 'goal',          severity: 'info',    soundGroup: 'positive' },
  'investment-alert':      { type: 'goal',          severity: 'info',    soundGroup: 'positive' },
  // info — Bilgilendirme
  'statement-reminder':    { type: 'payment',       severity: 'info',    soundGroup: 'info' },
  'recurring-expense':     { type: 'subscription',  severity: 'info',    soundGroup: 'info' },
  'contract-renewal':      { type: 'rent',          severity: 'info',    soundGroup: 'info' },
  'test-notification':     { type: 'payment',       severity: 'info',    soundGroup: 'info' },
  // reminder — Hatirlatma / Odeme
  'payment-reminder':      { type: 'payment',      severity: 'warning',  soundGroup: 'reminder' },
  'loan-reminder':         { type: 'payment',       severity: 'warning', soundGroup: 'reminder' },
  'rent-due':              { type: 'rent',          severity: 'warning',  soundGroup: 'reminder' },
  'recurring-bill':        { type: 'bill',          severity: 'warning',  soundGroup: 'reminder' },
  'subscription-renewal':  { type: 'subscription',  severity: 'warning', soundGroup: 'reminder' },
  // warning — Uyari
  'budget-alert':          { type: 'budget',        severity: 'warning',  soundGroup: 'warning' },
  'tax-reminder':          { type: 'tax',           severity: 'warning',  soundGroup: 'warning' },
  'vehicle-inspection':    { type: 'inspection',    severity: 'warning',  soundGroup: 'warning' },
  'kmh-reminder':          { type: 'payment',       severity: 'warning',  soundGroup: 'warning' },
  // urgent — Acil / Gecikmis
  'overdue-card':          { type: 'overdue',       severity: 'danger',   soundGroup: 'urgent' },
  'overdue-loan':          { type: 'overdue',       severity: 'danger',   soundGroup: 'urgent' },
  'overdue-reminder':      { type: 'overdue',       severity: 'danger',   soundGroup: 'urgent' },
  'kmh-critical':          { type: 'overdue',       severity: 'danger',   soundGroup: 'urgent' },
};

/** actionTypeId'den ses grubunu dondurur */
export function getSoundGroupForAction(actionTypeId: string): SoundGroup {
  return ACTION_TYPE_MAP[actionTypeId]?.soundGroup || 'info';
}

// Event buffering — React mount olmadan once gelen event'ler
let pendingEvents: NotificationInboxPayload[] = [];
let reactReady = false;

// Tap navigation buffering — React router hazir olmadan gelen tap event'leri
let pendingTapNav: { assetType: string; assetId: string } | null = null;

/** DeepLinkHandler mount oldugunda cagrilir — pending tap nav varsa dondurur ve temizler */
export function consumePendingTapNav(): { assetType: string; assetId: string } | null {
  const nav = pendingTapNav;
  pendingTapNav = null;
  return nav;
}

function dispatchOrBuffer(payload: NotificationInboxPayload) {
  if (reactReady) {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_INBOX_ADD, { detail: payload }));
  } else {
    pendingEvents.push(payload);
  }
}

/** React inbox hook mount oldugunda cagrilir — buffered event'leri flush eder */
export function markReactReady() {
  reactReady = true;
  if (pendingEvents.length > 0) {
    const events = [...pendingEvents];
    pendingEvents = [];
    events.forEach(payload => {
      window.dispatchEvent(new CustomEvent(NOTIFICATION_INBOX_ADD, { detail: payload }));
    });
  }
}

let initialized = false;

/** App baslarken bir kez cagrilir. Native degilse no-op. */
export function initNotificationBridge() {
  if (initialized) return;
  initialized = true;

  if (!Capacitor.isNativePlatform()) return;

  // Dynamic import — LocalNotifications ana bundle'da kalmasin
  import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
    // On-plan bildirim (uygulama acikken)
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      const actionTypeId = (notification as any).actionTypeId || '';
      const mapping = ACTION_TYPE_MAP[actionTypeId] || { type: 'payment' as NotificationType, severity: 'info' as NotificationSeverity, soundGroup: 'info' as SoundGroup };
      const assetMeta = extractAssetMeta((notification as any).extra);

      // Ses cal — grup bazli melodi
      playNotificationSound(mapping.soundGroup);

      dispatchOrBuffer({
        title: notification.title || '',
        message: notification.body || '',
        type: mapping.type,
        severity: mapping.severity,
        notificationId: notification.id,
        ...assetMeta,
      });
    });

    // Arka plan tap (kullanici bildirime tikladi)
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const notification = action.notification;
      const actionTypeId = (notification as any).actionTypeId || '';
      const mapping = ACTION_TYPE_MAP[actionTypeId] || { type: 'payment' as NotificationType, severity: 'info' as NotificationSeverity, soundGroup: 'info' as SoundGroup };
      const assetMeta = extractAssetMeta((notification as any).extra);

      // Ses yok — kullanici zaten tap yapmis
      dispatchOrBuffer({
        title: notification.title || '',
        message: notification.body || '',
        type: mapping.type,
        severity: mapping.severity,
        notificationId: notification.id,
        ...assetMeta,
      });

      // Navigate — bildirime tiklandiginda inbox'a yonlendir
      if (assetMeta.assetType && assetMeta.assetId) {
        // Buffer'a yaz (React hazir degilse consumed olacak)
        pendingTapNav = { assetType: assetMeta.assetType, assetId: assetMeta.assetId };
        // Ayni zamanda event dispatch et (React hazirsa yakalanacak)
        window.dispatchEvent(new CustomEvent(NOTIFICATION_TAP_NAV, {
          detail: { assetType: assetMeta.assetType, assetId: assetMeta.assetId },
        }));
      }
    });

  }).catch((err) => {
    console.warn('LocalNotifications listener setup failed:', err);
  });
}
