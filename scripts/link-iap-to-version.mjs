/**
 * IAP'ları version sayfasına bağla
 * appStoreVersions → inAppPurchasesV2 ilişkisi
 */
import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.join(__dirname, '..', 'AuthKey_3Y4L9XJC76.p8');
const KEY_ID = '3Y4L9XJC76';
const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';
const APP_ID = '6759491761';
const VERSION_ID = '33d8c9a6-81aa-446c-939f-3f9a86a632f8';
const MONTHLY_SUB_ID = '6760574063';
const YEARLY_SUB_ID = '6760574033';

function getToken() {
  const key = fs.readFileSync(KEY_PATH, 'utf8');
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const sig = crypto.sign('sha256', Buffer.from(`${header}.${payload}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${header}.${payload}.${sig}`;
}

function apiReq(method, reqPath, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({ hostname: 'api.appstoreconnect.apple.com', path: reqPath, method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}) } }, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', reject); if (bodyStr) req.write(bodyStr); req.end();
  });
}

const token = getToken();

// 1. Version'ın mevcut inAppPurchasesV2 ilişkisini kontrol et
console.log('1. Version IAP ilişkileri kontrol ediliyor...');
const existingRes = await apiReq('GET',
  `/v1/appStoreVersions/${VERSION_ID}/relationships/inAppPurchasesV2?limit=10`,
  null, token);
console.log(`   Status: ${existingRes.status}`);
console.log('   Mevcut:', JSON.stringify(existingRes.body?.data || existingRes.body, null, 2).slice(0, 300));

// 2. POST ile IAP ilişkisi ekle
console.log('\n2. Monthly IAP → Version ilişkilendiriliyor...');
const linkMonthly = await apiReq('POST',
  `/v1/appStoreVersions/${VERSION_ID}/relationships/inAppPurchasesV2`,
  {
    data: [
      { type: 'inAppPurchasesV2', id: MONTHLY_SUB_ID }
    ]
  }, token);
console.log(`   Status: ${linkMonthly.status}`);
if (linkMonthly.status >= 400) {
  console.log('   Yanıt:', JSON.stringify(linkMonthly.body, null, 2).slice(0, 500));
}

// 3. Yearly IAP ilişkilendir
console.log('\n3. Yearly IAP → Version ilişkilendiriliyor...');
const linkYearly = await apiReq('POST',
  `/v1/appStoreVersions/${VERSION_ID}/relationships/inAppPurchasesV2`,
  {
    data: [
      { type: 'inAppPurchasesV2', id: YEARLY_SUB_ID }
    ]
  }, token);
console.log(`   Status: ${linkYearly.status}`);
if (linkYearly.status >= 400) {
  console.log('   Yanıt:', JSON.stringify(linkYearly.body, null, 2).slice(0, 500));
}

// 4. Alternatif: subscriptions endpoint ile dene
console.log('\n4. Alternatif — subscriptions relationship...');
const altLink = await apiReq('POST',
  `/v1/appStoreVersions/${VERSION_ID}/relationships/subscriptions`,
  {
    data: [
      { type: 'subscriptions', id: MONTHLY_SUB_ID },
      { type: 'subscriptions', id: YEARLY_SUB_ID },
    ]
  }, token);
console.log(`   Status: ${altLink.status}`);
if (altLink.body) console.log('   Yanıt:', JSON.stringify(altLink.body).slice(0, 300));

// 5. App level'da IAP ilişkisi dene
console.log('\n5. App level inAppPurchasesV2...');
const appLink = await apiReq('GET',
  `/v1/apps/${APP_ID}/inAppPurchasesV2?limit=5&fields[inAppPurchasesV2]=productId,state`,
  null, token);
console.log(`   Status: ${appLink.status}`);
if (appLink.body?.data) {
  appLink.body.data.forEach(iap => {
    console.log(`   ${iap.attributes?.productId}: ${iap.attributes?.state}`);
  });
}
