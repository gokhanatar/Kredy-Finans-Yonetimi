/**
 * Version'ı IAP ile birlikte submit et
 * REJECTED → WAITING_FOR_REVIEW
 * İlk subscription, version ile aynı anda submit edilmeli
 */
import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const KEY_PATH = path.join(ROOT, 'AuthKey_3Y4L9XJC76.p8');
const KEY_ID = '3Y4L9XJC76';
const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';
const APP_ID = '6759491761';
const VERSION_ID = '33d8c9a6-81aa-446c-939f-3f9a86a632f8';
const MONTHLY_SUB_ID = '6760574063';
const YEARLY_SUB_ID = '6760574033';

function getToken() {
  const key = fs.readFileSync(KEY_PATH, 'utf8');
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: ISSUER_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 1200,
    aud: 'appstoreconnect-v1',
  })).toString('base64url');
  const sigInput = `${header}.${payload}`;
  const sig = crypto.sign('sha256', Buffer.from(sigInput), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${sigInput}.${sig}`;
}

function apiRequest(method, reqPath, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.appstoreconnect.apple.com',
      path: reqPath,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const token = getToken();

// 1. Mevcut version durumunu kontrol et
console.log('1. Version durumu kontrol ediliyor...');
const versionRes = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}?fields[appStoreVersions]=appStoreState,appVersionState,versionString`,
  null, token);
const vAttrs = versionRes.body?.data?.attributes;
console.log(`   appStoreState: ${vAttrs?.appStoreState}`);
console.log(`   appVersionState: ${vAttrs?.appVersionState}`);
console.log(`   version: ${vAttrs?.versionString}`);

// 2. REJECTED version için review notes güncelle (PassKit açıklaması)
console.log('\n2. Review detail güncelleniyor (PassKit notu)...');
const reviewDetailRes = await apiRequest('GET', `/v1/appStoreVersions/${VERSION_ID}/appStoreReviewDetail`, null, token);
const reviewDetailId = reviewDetailRes.body?.data?.id;
console.log(`   Review detail ID: ${reviewDetailId}`);

if (reviewDetailId) {
  const updateRes = await apiRequest('PATCH', `/v1/appStoreReviewDetails/${reviewDetailId}`, {
    data: {
      type: 'appStoreReviewDetails',
      id: reviewDetailId,
      attributes: {
        contactFirstName: 'Gokhan',
        contactLastName: 'Atar',
        contactPhone: '+90 555 000 0000',
        contactEmail: 'support@finansatlas.com',
        demoAccountName: '',
        demoAccountPassword: '',
        demoAccountRequired: false,
        notes: `PassKit Framework Note:
This app does NOT use Apple Pay, Wallet passes, or any PassKit functionality.
PassKit is automatically linked by Capacitor (our cross-platform framework) during iOS build compilation. We do not call any PassKit APIs at runtime. This is a known behavior with Capacitor-based apps.

IAP Note:
The app has two subscription products:
- com.finansatlas.app.pro.monthly ($1.99/month)
- com.finansatlas.app.pro.yearly ($9.99/year)

Both subscriptions unlock premium features: AI insights, investment portfolio, family finance sync, unlimited cards and accounts.

No login required to test the app - all features work with local storage.
For Pro features, use the 7-day free trial via the subscription screen.`,
      }
    }
  }, token);
  console.log(`   Review detail güncellendi: ${updateRes.status}`);
  if (updateRes.status >= 400) {
    console.log('   Hata:', JSON.stringify(updateRes.body?.errors?.[0]).slice(0, 200));
  }
}

// 3. appStoreVersionSubmissions ile version'ı submit et
// Bu aynı zamanda subscription'ları da tetikler
console.log('\n3. Version submit ediliyor (IAP ile birlikte)...');
const submitRes = await apiRequest('POST', '/v1/appStoreVersionSubmissions', {
  data: {
    type: 'appStoreVersionSubmissions',
    relationships: {
      appStoreVersion: {
        data: { type: 'appStoreVersions', id: VERSION_ID }
      }
    }
  }
}, token);

console.log(`   Submit status: ${submitRes.status}`);
if (submitRes.status === 201) {
  console.log('   ✅ Version incelemeye gönderildi!');
} else {
  console.log('   Yanıt:', JSON.stringify(submitRes.body, null, 2).slice(0, 1000));
}

// 4. REJECTED versiyonu için alternatif: appVersionState PATCH
if (submitRes.status !== 201) {
  console.log('\n4. Alternatif: PATCH appVersionState = WAITING_FOR_REVIEW...');
  const patchRes = await apiRequest('PATCH', `/v1/appStoreVersions/${VERSION_ID}`, {
    data: {
      type: 'appStoreVersions',
      id: VERSION_ID,
      attributes: {
        appVersionState: 'WAITING_FOR_REVIEW',
      }
    }
  }, token);
  console.log(`   PATCH status: ${patchRes.status}`);
  if (patchRes.status >= 400) {
    console.log('   Yanıt:', JSON.stringify(patchRes.body?.errors?.[0]).slice(0, 300));
  } else {
    console.log('   ✅ Başarılı!');
  }
}

// 5. Final version durumu
console.log('\n5. Final durum...');
const finalRes = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}?fields[appStoreVersions]=appStoreState,appVersionState`,
  null, token);
const finalAttrs = finalRes.body?.data?.attributes;
console.log(`   appStoreState: ${finalAttrs?.appStoreState}`);
console.log(`   appVersionState: ${finalAttrs?.appVersionState}`);

// 6. Subscription durumları da kontrol et
console.log('\n6. Subscription durumları...');
for (const [name, subId] of [['Monthly', MONTHLY_SUB_ID], ['Yearly', YEARLY_SUB_ID]]) {
  const res = await apiRequest('GET', `/v1/subscriptions/${subId}?fields[subscriptions]=state`, null, token);
  console.log(`   ${name}: ${res.body?.data?.attributes?.state}`);
}
