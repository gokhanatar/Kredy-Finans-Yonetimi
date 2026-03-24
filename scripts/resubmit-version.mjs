/**
 * REJECTED version'ı yeniden incelemeye gönder
 * Apple yeni API: appVersionState WAITING_FOR_REVIEW
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

// Yöntem 1: PATCH appVersionState = WAITING_FOR_REVIEW (yeni API)
console.log('Yöntem 1: PATCH appVersionState...');
const patch1 = await apiRequest('PATCH', `/v1/appStoreVersions/${VERSION_ID}`, {
  data: {
    type: 'appStoreVersions',
    id: VERSION_ID,
    attributes: {
      appVersionState: 'WAITING_FOR_REVIEW',
    }
  }
}, token);
console.log(`  Status: ${patch1.status}`);
if (patch1.status >= 400) {
  console.log('  Yanıt:', JSON.stringify(patch1.body).slice(0, 400));
}

// Yöntem 2: Eski endpoint - create submission with REJECTED version
console.log('\nYöntem 2: Eski appStoreReviewAttachments deneme...');
const method2 = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}/appStoreReviewAttachments?limit=5`,
  null, token);
console.log(`  Status: ${method2.status} | count: ${method2.body?.data?.length || 0}`);

// Yöntem 3: appStoreVersionLocalizations üzerinden
// Önce tüm localizations'ları kontrol et
console.log('\nYöntem 3: Version localizations durumu...');
const locRes = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale,description,keywords,whatsNew&limit=10`,
  null, token);
if (locRes.body?.data) {
  locRes.body.data.forEach(l => {
    console.log(`  ${l.attributes.locale}: desc=${!!l.attributes.description} | kw=${!!l.attributes.keywords}`);
  });
}

// Yöntem 4: iap submit endpoint
console.log('\nYöntem 4: IAP submit denemesi...');
for (const [name, subId] of [['Monthly', MONTHLY_SUB_ID], ['Yearly', YEARLY_SUB_ID]]) {
  // Try submitting individual subscription
  const subSubmit = await apiRequest('POST', `/v1/inAppPurchaseSubmissions`, {
    data: {
      type: 'inAppPurchaseSubmissions',
      relationships: {
        inAppPurchaseV2: {
          data: { type: 'inAppPurchasesV2', id: subId }
        }
      }
    }
  }, token);
  console.log(`  ${name}: ${subSubmit.status}`);
  if (subSubmit.status >= 400) {
    console.log(`  Yanıt:`, JSON.stringify(subSubmit.body?.errors?.[0]).slice(0, 200));
  }
}

// Yöntem 5: subscriptionSubmissions
console.log('\nYöntem 5: subscriptionSubmissions...');
for (const [name, subId] of [['Monthly', MONTHLY_SUB_ID], ['Yearly', YEARLY_SUB_ID]]) {
  const subSubmit = await apiRequest('POST', `/v1/subscriptionSubmissions`, {
    data: {
      type: 'subscriptionSubmissions',
      relationships: {
        subscription: {
          data: { type: 'subscriptions', id: subId }
        }
      }
    }
  }, token);
  console.log(`  ${name}: ${subSubmit.status}`);
  if (subSubmit.status >= 400) {
    console.log(`  Yanıt:`, JSON.stringify(subSubmit.body?.errors?.[0]).slice(0, 300));
  } else if (subSubmit.status === 201) {
    console.log(`  ✅ ${name} incelemeye gönderildi!`);
  }
}
