/**
 * Kredy — Firebase Cloud Functions
 * Aile verisinde degisiklik olunca diger uyelere push bildirim gonderir.
 *
 * iOS: Dogrudan APNs HTTP/2 API kullanir (Capacitor APNs device token dondurur).
 * Android: Firebase Admin Messaging (FCM) kullanir.
 *
 * Database yapisi:
 *   families/{familyId}/data/{dataKey} = { value, updatedBy, updatedAt }
 *   families/{familyId}/members/{memberId} = {
 *     name, joinedAt,
 *     fcmToken?,                         // geriye uyumluluk (eski iOS token)
 *     pushToken?: { token, platform }     // yeni format (ios/android)
 *   }
 */

const { onValueWritten } = require("firebase-functions/v2/database");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getMessaging } = require("firebase-admin/messaging");
const http2 = require("node:http2");
const fs = require("node:fs");
const path = require("node:path");
const jwt = require("jsonwebtoken");

initializeApp();

// APNs yapilandirmasi
const APNS_KEY_ID = "SFPDXXFF3M";
const TEAM_ID = "59ZAKYY5YZ";
const BUNDLE_ID = "com.finansatlas.app";
const APNS_KEY = fs.readFileSync(path.join(__dirname, "AuthKey_SFPDXXFF3M.p8"));

// JWT cache — APNs JWT'leri 1 saat gecerli, 50dk'da yenile
let cachedJWT = null;
let jwtExpiry = 0;

function getAPNsJWT() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJWT && now < jwtExpiry) {
    return cachedJWT;
  }
  cachedJWT = jwt.sign(
    { iss: TEAM_ID, iat: now },
    APNS_KEY,
    { algorithm: "ES256", header: { alg: "ES256", kid: APNS_KEY_ID } }
  );
  jwtExpiry = now + 3000; // 50 dakika
  return cachedJWT;
}

/**
 * APNs HTTP/2 ile push bildirim gonder
 * @param {string} deviceToken - APNs device token (hex string)
 * @param {object} payload - APNs payload
 * @param {boolean} sandbox - development mi production mi
 * @returns {Promise<{success: boolean, reason?: string, status?: number}>}
 */
function sendAPNsPush(deviceToken, payload, sandbox = true) {
  return new Promise((resolve) => {
    const host = sandbox
      ? "api.sandbox.push.apple.com"
      : "api.push.apple.com";

    let client;
    try {
      client = http2.connect(`https://${host}`);
    } catch (err) {
      console.error(`[APNs] HTTP/2 connect failed: ${err.message}`);
      resolve({ success: false, reason: `connect_failed: ${err.message}` });
      return;
    }

    client.on("error", (err) => {
      console.error(`[APNs] Client error: ${err.message}`);
      resolve({ success: false, reason: `client_error: ${err.message}` });
    });

    const headers = {
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      "authorization": `bearer ${getAPNsJWT()}`,
      "apns-topic": BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "apns-expiration": "0",
    };

    const req = client.request(headers);
    let responseData = "";
    let responseStatus = 0;

    // 10 saniye timeout
    const timeout = setTimeout(() => {
      req.close();
      client.close();
      resolve({ success: false, reason: "timeout" });
    }, 10000);

    req.on("response", (headers) => {
      responseStatus = headers[":status"];
    });

    req.on("data", (chunk) => {
      responseData += chunk;
    });

    req.on("end", () => {
      clearTimeout(timeout);
      client.close();

      if (responseStatus === 200) {
        resolve({ success: true, status: 200 });
      } else {
        let reason = `status_${responseStatus}`;
        try {
          const parsed = JSON.parse(responseData);
          reason = parsed.reason || reason;
        } catch { /* ignore */ }
        resolve({ success: false, reason, status: responseStatus });
      }
    });

    req.on("error", (err) => {
      clearTimeout(timeout);
      client.close();
      resolve({ success: false, reason: `req_error: ${err.message}` });
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Bildirim tipi → ses haritalamasi (iOS ve Android icin ortak)
const NOTIFICATION_SOUND_MAP = {
  "family-activity":  "kredy_info",
  "payment-reminder": "kredy_reminder",
  "golden-window":    "kredy_positive",
  "budget-alert":     "kredy_warning",
  "overdue":          "kredy_urgent",
};

// Android bildirim tipi → kanal + ses haritalamasi
const ANDROID_CHANNEL_MAP = {
  "family-activity":  { channelId: "family-activity",  sound: "kredy_info" },
  "payment-reminder": { channelId: "payment-reminder", sound: "kredy_reminder" },
  "golden-window":    { channelId: "golden-window",    sound: "kredy_positive" },
  "budget-alert":     { channelId: "budget-alert",     sound: "kredy_warning" },
  "overdue":          { channelId: "overdue-alert",    sound: "kredy_urgent" },
};

/**
 * FCM ile Android push bildirim gonder
 * @param {string} fcmToken - FCM registration token
 * @param {object} notificationData - { title, body, data }
 * @returns {Promise<{success: boolean, reason?: string}>}
 */
async function sendFCMPush(fcmToken, notificationData) {
  try {
    // Bildirim tipine gore kanal ve ses belirle
    const type = (notificationData.data && notificationData.data.type) || "family-activity";
    const channelInfo = ANDROID_CHANNEL_MAP[type] || ANDROID_CHANNEL_MAP["family-activity"];

    const message = {
      token: fcmToken,
      notification: {
        title: notificationData.title,
        body: notificationData.body,
      },
      data: notificationData.data || {},
      android: {
        priority: "high",
        notification: {
          channelId: channelInfo.channelId,
          sound: channelInfo.sound,
        },
      },
    };
    await getMessaging().send(message);
    return { success: true };
  } catch (err) {
    const reason = err.code || err.message || String(err);
    return { success: false, reason };
  }
}

// Bildirim icerik haritalari
const DATA_KEY_LABELS = {
  "family-transactions": { title: "Yeni islem", icon: "cash" },
  "family-goals": { title: "Hedef guncellendi", icon: "target" },
  "kredi-pusula-budgets": { title: "Butce guncellendi", icon: "bar-chart" },
  "kredi-pusula-accounts": { title: "Hesap guncellendi", icon: "wallet" },
  "kredi-pusula-subscriptions": { title: "Abonelik guncellendi", icon: "bell" },
  "kredi-pusula-recurring-expenses": { title: "Duzenli gider guncellendi", icon: "repeat" },
  "kredi-pusula-monthly-bills": { title: "Fatura guncellendi", icon: "file-text" },
};

/**
 * families/{familyId}/data/{dataKey} altinda herhangi bir veri degistiginde tetiklenir.
 * updatedBy ile yazan uyeyi belirler, diger uyelerin APNs token'larina dogrudan push gonderir.
 */
exports.onFamilyDataChange = onValueWritten(
  {
    ref: "/families/{familyId}/data/{dataKey}",
    instance: "finans-atlas-pro-default-rtdb",
    region: "europe-west1",
    memory: "128MiB",
  },
  async (event) => {
    const { familyId, dataKey } = event.params;
    const after = event.data.after.val();
    if (!after) {
      console.log(`[${familyId}] Data silindi, bildirim gonderilmiyor`);
      return;
    }

    const updatedBy = after.updatedBy;
    if (!updatedBy) {
      console.log(`[${familyId}] updatedBy yok, bildirim gonderilmiyor`);
      return;
    }

    // Uye adini ve diger uyelerin push tokenlarini al
    const db = getDatabase();
    const membersSnap = await db.ref(`families/${familyId}/members`).once("value");
    const members = membersSnap.val();
    if (!members) {
      console.log(`[${familyId}] Uye bulunamadi`);
      return;
    }

    const writerName = members[updatedBy]?.name || "Bir aile uyesi";

    // Diger uyelerin push tokenlarini topla (platform bilgisiyle)
    const targets = []; // { memberId, token, platform }
    for (const [mid, member] of Object.entries(members)) {
      if (mid === updatedBy) continue;

      // Yeni format: pushToken = { token, platform }
      if (member.pushToken && member.pushToken.token) {
        targets.push({
          memberId: mid,
          token: member.pushToken.token,
          platform: member.pushToken.platform || "ios",
        });
      }
      // Geriye uyumluluk: eski fcmToken — platform bilgisi member verisinden oku,
      // yoksa "android" varsay (eski format FCM token'ı idi, iOS yeni format kullanır)
      else if (member.fcmToken) {
        const legacyPlatform = member.platform || "android";
        targets.push({
          memberId: mid,
          token: member.fcmToken,
          platform: legacyPlatform,
        });
      }
    }

    if (targets.length === 0) {
      console.log(`[${familyId}] Gonderilecek token yok (diger uyelerde token bulunamadi)`);
      // Mevcut uyeleri logla (token degerleri redakte edildi)
      for (const [mid, member] of Object.entries(members)) {
        const hasPushToken = !!(member.pushToken && member.pushToken.token);
        const platform = hasPushToken ? member.pushToken.platform : "unknown";
        console.log(`  ${mid}: hasToken=${hasPushToken || !!member.fcmToken}, platform=${platform}`);
      }
      return;
    }

    // Bildirim icerigini olustur
    const keyInfo = DATA_KEY_LABELS[dataKey] || { title: "Aile verisi guncellendi", icon: "users" };
    let body = `${writerName} aile verilerini guncelledi`;

    // Transaction icin ozel mesaj
    if (dataKey === "family-transactions" && Array.isArray(after.value)) {
      const txs = after.value;
      const lastTx = txs[txs.length - 1];
      if (lastTx && lastTx.createdBy === updatedBy) {
        const amt = Number(lastTx.amount || 0).toLocaleString("tr-TR");
        const cat = lastTx.category || "";
        if (lastTx.type === "expense") {
          body = `${writerName} ${cat} icin ${amt} TL harcadi`;
        } else {
          body = `${writerName} ${amt} TL gelir ekledi`;
        }
      }
    }

    // Bildirim tipi (ileride farkli tiplerle genisletilebilir)
    const notifType = "family-activity";
    // APNs payload — ses bildirim tipine gore secilir (Android ile ayni harita)
    const apnsSound = (NOTIFICATION_SOUND_MAP[notifType] || "kredy_info") + ".wav";
    const apnsPayload = {
      aps: {
        alert: {
          title: keyInfo.title,
          body: body,
        },
        sound: apnsSound,
        badge: 1,
        "content-available": 1,
      },
      // Custom data
      type: notifType,
      familyId: familyId,
      dataKey: dataKey,
      updatedBy: updatedBy,
    };

    console.log(`[${familyId}] ${targets.length} kişiye push gonderiliyor: "${keyInfo.title}" - "${body}"`);

    // Platforma gore push gonder
    const results = await Promise.all(
      targets.map(async ({ memberId, token, platform }) => {
        let result;

        if (platform === "android") {
          // Android: FCM ile gonder
          result = await sendFCMPush(token, {
            title: keyInfo.title,
            body: body,
            data: {
              type: notifType,
              familyId: familyId,
              dataKey: dataKey,
              updatedBy: updatedBy,
            },
          });
        } else {
          // iOS: APNs — emulator/local uses sandbox, deployed functions use production
          const useSandbox = !!process.env.FUNCTIONS_EMULATOR;
          result = await sendAPNsPush(token, apnsPayload, useSandbox);
          if (!result.success && result.reason === "BadDeviceToken") {
            console.log(`[${familyId}] APNs basarisiz (sandbox=${useSandbox}), diger ortam deneniyor: ${memberId}`);
            result = await sendAPNsPush(token, apnsPayload, !useSandbox);
          }
        }

        return { memberId, platform, ...result };
      })
    );

    // Sonuclari logla ve gecersiz tokenlari temizle
    let successCount = 0;
    for (const result of results) {
      if (result.success) {
        successCount++;
        console.log(`  ✓ ${result.memberId} [${result.platform}]: push gonderildi`);
      } else {
        console.error(`  ✗ ${result.memberId} [${result.platform}]: ${result.reason} (status: ${result.status})`);

        // Gecersiz token — Firebase'den sil
        const invalidReasons = [
          "BadDeviceToken", "Unregistered", "ExpiredToken",                    // APNs
          "messaging/invalid-registration-token", "messaging/registration-token-not-registered", // FCM
        ];
        if (invalidReasons.includes(result.reason)) {
          await db.ref(`families/${familyId}/members/${result.memberId}/pushToken`).remove();
          await db.ref(`families/${familyId}/members/${result.memberId}/fcmToken`).remove();
          console.log(`  → Gecersiz token silindi: ${result.memberId} [${result.platform}]`);
        }
      }
    }

    console.log(
      `[${familyId}] Sonuc: ${successCount}/${targets.length} push basarili (${dataKey})`
    );
  }
);
