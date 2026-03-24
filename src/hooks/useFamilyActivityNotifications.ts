import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useFamilySync } from '@/contexts/FamilySyncContext';
import { useNotificationInbox } from '@/hooks/useNotificationInbox';
import { FAMILY_STORAGE_KEYS, ALL_CATEGORIES } from '@/types/familyFinance';
import { playNotificationSound } from '@/lib/notificationSoundService';
import { toast } from '@/hooks/use-toast';

export const FAMILY_REMOTE_UPDATE_EVENT = 'family-remote-update';

// Sistem bildirimi gonder (native platformda — uygulama arka plandayken de gorunur)
let systemNotifIdCounter = 50000;
async function sendSystemNotification(title: string, body: string, sound: string = 'kredy_info.wav') {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const id = systemNotifIdCounter++;
    if (systemNotifIdCounter > 59999) systemNotifIdCounter = 50000;
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title,
        body,
        schedule: { at: new Date(Date.now() + 500) },
        sound,
        actionTypeId: 'family-activity',
      }],
    });
  } catch { /* web — no Capacitor */ }
}

function getCategoryLabel(categoryId: string): string {
  return ALL_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Headless hook — listens for family data changes from other members
 * and creates inbox notifications + toasts + sounds.
 *
 * Covers:
 * - Transactions (expense/income)
 * - Goal contributions
 * - Budget updates
 * - Account updates
 * - Member join/leave
 */
const NOTIFICATION_SETTINGS_KEY = 'kredi-pusula-notification-settings';

function isFamilyActivityEnabled(): boolean {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!stored) return true; // Default on
    const settings = JSON.parse(stored);
    return settings.familyActivityNotification !== false && settings.enabled !== false;
  } catch {
    return true;
  }
}

export function useFamilyActivityNotifications() {
  const { isConnected, memberId, members } = useFamilySync();
  const { addNotification } = useNotificationInbox();

  // --- Refs for tracking state ---
  const knownTxIdsRef = useRef<Set<string>>(new Set());
  const knownGoalAmountsRef = useRef<Map<string, number>>(new Map());
  const initializedKeysRef = useRef<Set<string>>(new Set());
  const lastNotifiedKeyRef = useRef<Map<string, number>>(new Map());
  const knownMemberIdsRef = useRef<Set<string> | null>(null);
  const lastSoundTimeRef = useRef(0);

  // Initialize known IDs from localStorage on mount
  // Bu sayede uygulama acildiginda zaten var olan islemler icin bildirim gitmez,
  // sadece YENI eklenenler icin bildirim gider.
  useEffect(() => {
    try {
      const txStored = localStorage.getItem(FAMILY_STORAGE_KEYS.TRANSACTIONS);
      if (txStored) {
        const txs = JSON.parse(txStored);
        if (Array.isArray(txs)) {
          txs.forEach((tx: any) => {
            if (tx.id) knownTxIdsRef.current.add(tx.id);
          });
        }
      }
      // Transactions key'ini baslatilmis olarak isaretle — localStorage'dan okuduk
      initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.TRANSACTIONS);
    } catch { /* ignore */ }

    try {
      const goalStored = localStorage.getItem(FAMILY_STORAGE_KEYS.GOALS);
      if (goalStored) {
        const goals = JSON.parse(goalStored);
        if (Array.isArray(goals)) {
          goals.forEach((g: any) => {
            if (g.id) knownGoalAmountsRef.current.set(g.id, g.currentAmount || 0);
          });
        }
      }
      // Goals key'ini baslatilmis olarak isaretle
      initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.GOALS);
    } catch { /* ignore */ }

    // Diger key'leri de baslatilmis olarak isaretle — ilk event yutulmasin
    initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.BUDGETS);
    initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.ACCOUNTS);
    initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.SUBSCRIPTIONS);
    initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.RECURRING_EXPENSES);
    if (FAMILY_STORAGE_KEYS.MONTHLY_BILLS) {
      initializedKeysRef.current.add(FAMILY_STORAGE_KEYS.MONTHLY_BILLS);
    }
  }, []);

  // --- Member join/leave tracking ---
  useEffect(() => {
    if (!isConnected || !memberId) return;

    const currentIds = new Set(Object.keys(members));

    // First render — initialize without notifying
    if (knownMemberIdsRef.current === null) {
      knownMemberIdsRef.current = currentIds;
      return;
    }

    if (!isFamilyActivityEnabled()) {
      knownMemberIdsRef.current = currentIds;
      return;
    }

    // Detect new members
    for (const id of currentIds) {
      if (!knownMemberIdsRef.current.has(id) && id !== memberId) {
        const member = members[id];
        if (member) {
          const t = `${member.name} aileye katıldı!`;
          const m = 'Yeni bir aile üyesi gruba katıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          toast({ title: t, description: m });
          sendSystemNotification(t, m, 'kredy_positive.wav');
          playNotificationSound('positive');
        }
      }
    }

    // Detect left members
    for (const id of knownMemberIdsRef.current) {
      if (!currentIds.has(id) && id !== memberId) {
        addNotification({
          title: 'Bir üye aileden ayrıldı',
          message: 'Bir aile üyesi gruptan ayrıldı',
          type: 'family',
          severity: 'info',
        });
      }
    }

    knownMemberIdsRef.current = currentIds;
  }, [isConnected, memberId, members, addNotification]);

  // --- Listen for remote data updates (transactions, goals, budgets, accounts) ---
  useEffect(() => {
    if (!isConnected || !memberId) return;

    const playSoundThrottled = (group: 'info' | 'positive') => {
      if (Date.now() - lastSoundTimeRef.current > 3000) {
        playNotificationSound(group);
        lastSoundTimeRef.current = Date.now();
      }
    };

    function handleRemoteUpdate(e: Event) {
      console.log('[FamilyNotif] EVENT RECEIVED:', (e as CustomEvent).detail?.key);
      if (!isFamilyActivityEnabled()) {
        console.log('[FamilyNotif] Bildirimler kapali, atlaniyor');
        return;
      }
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const { key, updatedBy, data } = detail;
      if (!key || !updatedBy || data == null) {
        console.log('[FamilyNotif] Eksik data, atlaniyor:', { key, updatedBy, hasData: data != null });
        return;
      }
      console.log('[FamilyNotif] PROCESSING: key=' + key + ', updatedBy=' + updatedBy + ', dataLength=' + (Array.isArray(data) ? data.length : 'N/A'));

      const memberName = members[updatedBy]?.name || 'Bir aile üyesi';

      // ==================== TRANSACTIONS ====================
      if (key === FAMILY_STORAGE_KEYS.TRANSACTIONS && Array.isArray(data)) {
        if (!initializedKeysRef.current.has(key)) {
          // Ilk event — mevcut ID'leri kaydet + key'i isaretle
          data.forEach((tx: any) => {
            if (tx.id) knownTxIdsRef.current.add(tx.id);
          });
          initializedKeysRef.current.add(key);
          // Mount'ta localStorage'dan okuyamadiysa buraya duser
          // Ama yine de devam et — belki yeni tx var
        }

        const newTxs = data.filter(
          (tx: any) => tx.id && !knownTxIdsRef.current.has(tx.id) && tx.createdBy !== memberId
        );

        // Update known IDs
        data.forEach((tx: any) => {
          if (tx.id) knownTxIdsRef.current.add(tx.id);
        });

        if (newTxs.length === 0) return;

        if (newTxs.length <= 3) {
          for (const tx of newTxs) {
            const txMember = tx.createdBy
              ? (members[tx.createdBy]?.name || memberName)
              : memberName;
            const cat = getCategoryLabel(tx.category);
            const amt = formatAmount(tx.amount);

            if (tx.type === 'expense') {
              const t = `${txMember} harcama yaptı`;
              const m = `${cat} için ${amt} TL harcadı`;
              addNotification({ title: t, message: m, type: 'family', severity: 'info' });
              toast({ title: t, description: `${cat} — ${amt} TL` });
              sendSystemNotification(t, m, 'kredy_info.wav');
            } else {
              const t = `${txMember} gelir ekledi`;
              const m = `${cat}: ${amt} TL`;
              addNotification({ title: t, message: m, type: 'family', severity: 'info' });
              toast({ title: t, description: `${cat} — ${amt} TL` });
              sendSystemNotification(t, m, 'kredy_positive.wav');
            }
          }
        } else {
          // Batch notification
          const total = newTxs.reduce((s: number, tx: any) => s + (tx.amount || 0), 0);
          const t = `${memberName} ${newTxs.length} işlem ekledi`;
          const m = `Toplam: ${formatAmount(total)} TL`;
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          toast({ title: t, description: m });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }

        playSoundThrottled('info');
        return;
      }

      // ==================== GOALS ====================
      if (key === FAMILY_STORAGE_KEYS.GOALS && Array.isArray(data)) {
        if (!initializedKeysRef.current.has(key)) {
          data.forEach((g: any) => {
            if (g.id) knownGoalAmountsRef.current.set(g.id, g.currentAmount || 0);
          });
          initializedKeysRef.current.add(key);
          // Mount'ta okunamadiysa buraya duser, ama devam et
        }

        // Dedup: 30-second window
        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) {
          data.forEach((g: any) => {
            if (g.id) knownGoalAmountsRef.current.set(g.id, g.currentAmount || 0);
          });
          return;
        }

        let notified = false;
        for (const goal of data) {
          const prev = knownGoalAmountsRef.current.get(goal.id);
          if (prev !== undefined && goal.currentAmount > prev) {
            const diff = goal.currentAmount - prev;
            const t = `${memberName} hedefe katkı yaptı`;
            const m = `"${goal.name}" hedefine ${formatAmount(diff)} TL ekledi`;
            addNotification({ title: t, message: m, type: 'family', severity: 'info' });
            toast({ title: t, description: `"${goal.name}" — ${formatAmount(diff)} TL` });
            sendSystemNotification(t, m, 'kredy_positive.wav');
            notified = true;
          }
        }

        data.forEach((g: any) => {
          if (g.id) knownGoalAmountsRef.current.set(g.id, g.currentAmount || 0);
        });

        if (notified) {
          lastNotifiedKeyRef.current.set(key, Date.now());
          playSoundThrottled('positive');
        }
        return;
      }

      // ==================== BUDGETS ====================
      if (key === FAMILY_STORAGE_KEYS.BUDGETS) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }

        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;

        {
          const t = `${memberName} bütçeyi güncelledi`;
          const m = 'Aile bütçesinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          toast({ title: t, description: m });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }

      // ==================== ACCOUNTS ====================
      if (key === FAMILY_STORAGE_KEYS.ACCOUNTS) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }

        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;

        {
          const t = `${memberName} hesapları güncelledi`;
          const m = 'Aile hesap bilgilerinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }

      // ==================== SUBSCRIPTIONS ====================
      if (key === FAMILY_STORAGE_KEYS.SUBSCRIPTIONS) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }

        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;

        {
          const t = `${memberName} abonelikleri güncelledi`;
          const m = 'Aile abonelik bilgilerinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }

      // ==================== RECURRING EXPENSES ====================
      if (key === FAMILY_STORAGE_KEYS.RECURRING_EXPENSES) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }

        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;

        {
          const t = `${memberName} düzenli giderleri güncelledi`;
          const m = 'Aile düzenli gider bilgilerinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }

      // ==================== RECURRING BILLS ====================
      if (key === FAMILY_STORAGE_KEYS.MONTHLY_BILLS) {
        if (!initializedKeysRef.current.has(key)) {
          initializedKeysRef.current.add(key);
        }

        const lastNotified = lastNotifiedKeyRef.current.get(key);
        if (lastNotified && Date.now() - lastNotified < 30000) return;

        {
          const t = `${memberName} faturaları güncelledi`;
          const m = 'Aile fatura bilgilerinde değişiklik yapıldı';
          addNotification({ title: t, message: m, type: 'family', severity: 'info' });
          sendSystemNotification(t, m, 'kredy_info.wav');
        }
        lastNotifiedKeyRef.current.set(key, Date.now());
        playSoundThrottled('info');
        return;
      }
    }

    window.addEventListener(FAMILY_REMOTE_UPDATE_EVENT, handleRemoteUpdate);
    return () => window.removeEventListener(FAMILY_REMOTE_UPDATE_EVENT, handleRemoteUpdate);
  }, [isConnected, memberId, members, addNotification]);
}
