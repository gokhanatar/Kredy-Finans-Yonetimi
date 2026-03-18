/**
 * useFCMRegistration
 * APNs device token alir ve Firebase'e kaydeder.
 * Debug bilgisini Firebase'e yazar (debug/push/).
 */
import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useFamilySync } from '@/contexts/FamilySyncContext';

const APNS_TOKEN_KEY = 'kredi-pusula-apns-token';
const DB_URL = import.meta.env.VITE_FIREBASE_DATABASE_URL || '';

/** Get Firebase ID token for authenticated REST calls. */
async function getAuthToken(): Promise<string | null> {
  try {
    const { getAuth } = await import('firebase/auth');
    const { getApps } = await import('firebase/app');
    const apps = getApps();
    if (apps.length === 0) return null;
    const auth = getAuth(apps[0]);
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/** Build REST URL with auth token if available. */
function buildAuthUrl(path: string, idToken: string | null): string {
  const base = `${DB_URL}/${path}.json`;
  return idToken ? `${base}?auth=${encodeURIComponent(idToken)}` : base;
}

// Firebase REST ile debug log yaz (hook import etmeden direkt fetch)
async function debugLog(step: string, data: Record<string, unknown> = {}) {
  try {
    const payload = { step, ts: Date.now(), platform: Capacitor.getPlatform(), ...data };
    const idToken = await getAuthToken();
    await fetch(buildAuthUrl(`debug/push/${Date.now()}`, idToken), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch { /* ignore */ }
}

export function useFCMRegistration() {
  const { isConnected, familyId, memberId } = useFamilySync();
  const tokenRef = useRef<string | null>(null);
  const uploadedRef = useRef(false);
  const familyIdRef = useRef(familyId);
  const memberIdRef = useRef(memberId);
  // A2: Promise-based guard instead of boolean flag to prevent race conditions
  const uploadPromiseRef = useRef<Promise<void> | null>(null);

  familyIdRef.current = familyId;
  memberIdRef.current = memberId;

  const uploadToken = useCallback(async (token: string, fId: string, mId: string) => {
    // A2: If an upload is already in progress, wait for it instead of skipping
    if (uploadPromiseRef.current) {
      await uploadPromiseRef.current;
      return;
    }

    const doUpload = async () => {
      const platform = Capacitor.getPlatform(); // 'ios' | 'android'
      try {
        await debugLog('upload_start', { familyId: fId, memberId: mId, tokenLen: token.length, platform });

        // A1: Get auth token for authenticated REST calls
        const idToken = await getAuthToken();

        // Token ve platform bilgisini birlikte kaydet
        const tokenData = { token, platform };
        const res = await fetch(buildAuthUrl(`families/${fId}/members/${mId}/pushToken`, idToken), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokenData),
        });

        // Geriye uyumluluk: eski fcmToken alanini da guncelle
        await fetch(buildAuthUrl(`families/${fId}/members/${mId}/fcmToken`, idToken), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(token),
        });

        if (!res.ok) {
          await debugLog('upload_fail', { status: res.status, body: await res.text() });
          return;
        }
        uploadedRef.current = true;
        await debugLog('upload_success', { familyId: fId, memberId: mId, platform });
      } catch (err: any) {
        await debugLog('upload_error', { error: err?.message || String(err) });
      }
    };

    uploadPromiseRef.current = doUpload();
    try {
      await uploadPromiseRef.current;
    } finally {
      uploadPromiseRef.current = null;
    }
  }, []);

  // Asama 1: APNs token al
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const savedToken = localStorage.getItem(APNS_TOKEN_KEY);
    if (savedToken) {
      tokenRef.current = savedToken;
      debugLog('saved_token_found', { tokenLen: savedToken.length });
    }

    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        await debugLog('plugin_loading');
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await debugLog('plugin_loaded');

        // Izin iste
        const permResult = await PushNotifications.requestPermissions();
        await debugLog('perm_result', { receive: permResult.receive });

        if (permResult.receive !== 'granted') {
          await debugLog('perm_denied', { receive: permResult.receive });
          return;
        }

        await debugLog('adding_listeners');

        // Token gelince
        const regListener = await PushNotifications.addListener('registration', async (result) => {
          const token = result.value;
          await debugLog('token_received', { tokenLen: token.length, tokenPreview: token.slice(0, 20) });

          tokenRef.current = token;
          localStorage.setItem(APNS_TOKEN_KEY, token);

          // Aile bagliysa hemen yukle
          const fId = familyIdRef.current;
          const mId = memberIdRef.current;
          if (fId && mId) {
            await uploadToken(token, fId, mId);
          } else {
            await debugLog('token_saved_no_family');
          }
        });

        const errListener = await PushNotifications.addListener('registrationError', async (err) => {
          await debugLog('registration_error', { error: JSON.stringify(err) });
        });

        const recvListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          debugLog('push_foreground', { title: notification.title });
        });

        const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          debugLog('push_tapped', { title: action.notification.title });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('push-tap-navigate', {
              detail: { route: '/notification-inbox' },
            }));
          }
        });

        cleanup = () => {
          regListener.remove();
          errListener.remove();
          recvListener.remove();
          actionListener.remove();
        };

        await debugLog('calling_register');
        await PushNotifications.register();
        await debugLog('register_called');

        // Fallback: 5 sn sonra token hala gelmemisse tekrar dene
        setTimeout(async () => {
          if (!tokenRef.current) {
            await debugLog('fallback_retry_register');
            try {
              await PushNotifications.register();
              await debugLog('fallback_register_called');
            } catch (e: any) {
              await debugLog('fallback_register_error', { error: e?.message });
            }
          }
        }, 5000);

      } catch (err: any) {
        await debugLog('setup_fatal', { error: err?.message || String(err) });
      }
    })();

    return () => { cleanup?.(); };
  }, []);

  // Asama 2: Aile baglantisi kurulunca token yukle
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!isConnected || !familyId || !memberId) return;
    if (uploadedRef.current) return;

    const token = tokenRef.current || localStorage.getItem(APNS_TOKEN_KEY);
    if (token) {
      debugLog('family_connected_uploading', { familyId, memberId });
      uploadToken(token, familyId, memberId);
    } else {
      debugLog('family_connected_no_token', { familyId, memberId });
      // Token henuz yok — 3 sn sonra tekrar kontrol et
      const timer = setTimeout(() => {
        const t = tokenRef.current || localStorage.getItem(APNS_TOKEN_KEY);
        if (t && !uploadedRef.current) {
          debugLog('delayed_upload', { familyId, memberId });
          uploadToken(t, familyId, memberId);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, familyId, memberId, uploadToken]);
}
