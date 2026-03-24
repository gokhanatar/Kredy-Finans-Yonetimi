/**
 * MISSING_METADATA sorununu diagnose et
 * Apple'ın neyi eksik gördüğünü bul
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
const GROUP_ID = '21977460';

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

// Subscription group localization
console.log('=== Subscription Group Localizations ===');
const groupLocRes = await apiRequest('GET',
  `/v1/subscriptionGroups/${GROUP_ID}/subscriptionGroupLocalizations?limit=20`,
  null, token);
console.log(`Status: ${groupLocRes.status}`);
if (groupLocRes.body?.data) {
  groupLocRes.body.data.forEach(l => {
    console.log(`  ${l.attributes.locale}: "${l.attributes.customAppName || l.attributes.name || '(boş)'}"`);
  });
} else {
  console.log(JSON.stringify(groupLocRes.body).slice(0, 300));
}

// Subscription screenshot (varsa)
console.log('\n=== Monthly Promotional Offer ===');
const promoRes = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}/promotionalOffers?limit=5`,
  null, token);
console.log(`Status: ${promoRes.status} | count: ${promoRes.body?.data?.length || 0}`);

// Introductory offer
console.log('\n=== Monthly Introductory Offer ===');
const introRes = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}/introductoryOffers?limit=5`,
  null, token);
console.log(`Status: ${introRes.status} | count: ${introRes.body?.data?.length || 0}`);
if (introRes.body?.data?.length > 0) {
  introRes.body.data.forEach(o => console.log(`  ${JSON.stringify(o.attributes)}`));
}

// Try to understand what's blocking MISSING_METADATA
// Check if subscription group has required localization
console.log('\n=== Subscription Group tam bilgi ===');
const groupFull = await apiRequest('GET',
  `/v1/subscriptionGroups/${GROUP_ID}`,
  null, token);
console.log(JSON.stringify(groupFull.body?.data?.attributes, null, 2));

// Try submitting both subscriptions for review as part of version
console.log('\n=== Version submit deneme ===');
// In App Store Connect, when version is REJECTED, you can resubmit
// The IAP needs to be "READY_TO_SUBMIT" state first
// Check if we need to create subscription review screenshots

// Check if there's an inapppurchasesv2 related to this version
const iapVersionRes = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}?include=appStoreReviewDetail`,
  null, token);
console.log(`Version include: ${iapVersionRes.status}`);
if (iapVersionRes.body?.data) {
  console.log('Version ID:', iapVersionRes.body.data.id);
  console.log('Type:', iapVersionRes.body.data.type);
  console.log('Attributes:', JSON.stringify(iapVersionRes.body.data.attributes, null, 2).slice(0, 300));
}
if (iapVersionRes.body?.included) {
  iapVersionRes.body.included.forEach(i => {
    console.log('Included:', i.type, JSON.stringify(i.attributes).slice(0, 200));
  });
}
