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

// Monthly detay
const monthlyRes = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}?fields[subscriptions]=productId,name,state,reviewNote,subscriptionPeriod`,
  null, token);
console.log('=== Monthly ===');
console.log(JSON.stringify(monthlyRes.body?.data?.attributes, null, 2));

// Monthly lokalizasyonlar
const monthlyLocRes = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}/subscriptionLocalizations?limit=20`,
  null, token);
console.log('\nMonthly lokalizasyonlar:');
monthlyLocRes.body?.data?.forEach(l => {
  console.log(`  ${l.attributes.locale}: "${l.attributes.name}" — "${l.attributes.description?.slice(0, 50)}..."`);
});

// Yearly detay
const yearlyRes = await apiRequest('GET',
  `/v1/subscriptions/${YEARLY_SUB_ID}?fields[subscriptions]=productId,name,state,reviewNote,subscriptionPeriod`,
  null, token);
console.log('\n=== Yearly ===');
console.log(JSON.stringify(yearlyRes.body?.data?.attributes, null, 2));

// Yearly lokalizasyonlar
const yearlyLocRes = await apiRequest('GET',
  `/v1/subscriptions/${YEARLY_SUB_ID}/subscriptionLocalizations?limit=20`,
  null, token);
console.log('\nYearly lokalizasyonlar:');
yearlyLocRes.body?.data?.forEach(l => {
  console.log(`  ${l.attributes.locale}: "${l.attributes.name}" — "${l.attributes.description?.slice(0, 50)}..."`);
});

// Version review notes mevcut durumu
const verRes = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}?fields[appStoreVersions]=appStoreState,versionString,reviewType,reviewNotes`,
  null, token);
console.log('\n=== Version ===');
const attrs = verRes.body?.data?.attributes;
console.log(`State: ${attrs?.appStoreState}`);
console.log(`Notes: ${attrs?.reviewNotes?.slice(0, 200) || '(boş)'}`);

// IAP review submission durumu
console.log('\n=== Review submission ===');
// Try to submit IAP for review
const submitMonthly = await apiRequest('POST', `/v1/appStoreVersions/${VERSION_ID}/appStoreReviewDetail`, {
  data: {
    type: 'appStoreReviewDetails',
    attributes: {
      notesForReviewer: 'Test account: test@kredy.app / KredyTest2024! — PassKit is auto-linked by Capacitor, no Apple Pay used.',
    },
    relationships: {
      appStoreVersion: { data: { type: 'appStoreVersions', id: VERSION_ID } }
    }
  }
}, token);
console.log(`Review detail create: ${submitMonthly.status}`);
if (submitMonthly.status >= 400) {
  console.log(JSON.stringify(submitMonthly.body).slice(0, 300));
}
