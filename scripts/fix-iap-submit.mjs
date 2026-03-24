/**
 * IAP durumunu diagnose et ve mümkünse düzelt
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const token = getToken();

// 1. Monthly fiyat durumu - detaylı
console.log('=== Monthly fiyatlar ===');
const monthlyPrices = await apiRequest('GET', `/v1/subscriptions/${MONTHLY_SUB_ID}/prices?include=subscriptionPricePoint&limit=10`, null, token);
console.log(`Status: ${monthlyPrices.status}`);
if (monthlyPrices.body?.data) {
  monthlyPrices.body.data.forEach(p => {
    console.log(`  ${p.id}: startDate=${p.attributes?.startDate}, preserved=${p.attributes?.preserveCurrentPrice}`);
  });
} else {
  console.log(JSON.stringify(monthlyPrices.body).slice(0, 500));
}

// 2. Yearly fiyat
console.log('\n=== Yearly fiyatlar ===');
const yearlyPrices = await apiRequest('GET', `/v1/subscriptions/${YEARLY_SUB_ID}/prices?limit=10`, null, token);
console.log(`Status: ${yearlyPrices.status}`);
if (yearlyPrices.body?.data) {
  yearlyPrices.body.data.forEach(p => {
    console.log(`  ${p.id}: startDate=${p.attributes?.startDate}`);
  });
}

// 3. Monthly - tam attributes
console.log('\n=== Monthly tam attributes ===');
const monthlyFull = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}`,
  null, token);
console.log(JSON.stringify(monthlyFull.body?.data?.attributes, null, 2));

// 4. Yearly - tam attributes
console.log('\n=== Yearly tam attributes ===');
const yearlyFull = await apiRequest('GET',
  `/v1/subscriptions/${YEARLY_SUB_ID}`,
  null, token);
console.log(JSON.stringify(yearlyFull.body?.data?.attributes, null, 2));

// 5. Version review detail mevcut
console.log('\n=== Version review detail ===');
const reviewDetail = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}/appStoreReviewDetail`,
  null, token);
console.log(`Status: ${reviewDetail.status}`);
if (reviewDetail.body?.data) {
  console.log(JSON.stringify(reviewDetail.body.data.attributes, null, 2));
} else {
  console.log(JSON.stringify(reviewDetail.body).slice(0, 300));
}

// 6. Version tam durumu
console.log('\n=== Version tam durum ===');
const verFull = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}?fields[appStoreVersions]=appStoreState,versionString,reviewType,reviewNotes,earliestReleaseDate`,
  null, token);
console.log(JSON.stringify(verFull.body?.data?.attributes, null, 2));

// 7. Try submitting IAP for review directly
console.log('\n=== Monthly submit for review denemesi ===');
// Apple API: appStoreVersionSubmissions - submits whole version
// But for IAP specifically, need to include them in the version
// Check if we can attach IAP to version review
const attachRes = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}/appStoreVersionSubmission`,
  null, token);
console.log(`Submission check: ${attachRes.status}`);
console.log(JSON.stringify(attachRes.body).slice(0, 300));
