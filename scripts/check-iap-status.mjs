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

function apiRequest(method, reqPath, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.appstoreconnect.apple.com',
      path: reqPath,
      method,
      headers: { 'Authorization': `Bearer ${token}` },
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
    req.end();
  });
}

const token = getToken();

// IAP listesi
const iapRes = await apiRequest('GET', `/v1/apps/${APP_ID}/inAppPurchasesV2?limit=20&fields[inAppPurchases]=productId,name,inAppPurchaseType,state`, token);
console.log('\n=== IAP ürünleri ===');
if (iapRes.body?.data) {
  iapRes.body.data.forEach(iap => {
    console.log(`  ${iap.attributes.productId} | ${iap.attributes.state} | ${iap.attributes.name}`);
  });
} else {
  console.log('IAP bulunamadı veya hata:', JSON.stringify(iapRes.body).slice(0, 500));
}

// Subscriptions
const subRes = await apiRequest('GET', `/v1/apps/${APP_ID}/subscriptionGroups?limit=10`, token);
console.log('\n=== Subscription Grupları ===');
if (subRes.body?.data) {
  subRes.body.data.forEach(g => {
    console.log(`  Group: ${g.id} | ${g.attributes?.referenceName || 'N/A'}`);
  });

  // Her grup için subscription listesi
  for (const group of subRes.body.data) {
    const subsRes = await apiRequest('GET', `/v1/subscriptionGroups/${group.id}/subscriptions?limit=10&fields[subscriptions]=productId,name,state`, token);
    if (subsRes.body?.data) {
      subsRes.body.data.forEach(sub => {
        console.log(`    Sub: ${sub.attributes.productId} | ${sub.attributes.state} | ${sub.attributes.name}`);
      });
    }
  }
} else {
  console.log('Subscription grubu bulunamadı:', JSON.stringify(subRes.body).slice(0, 200));
}

// Version durumu
const verRes = await apiRequest('GET', `/v1/appStoreVersions/${VERSION_ID}?fields[appStoreVersions]=appStoreState,versionString,reviewType`, token);
console.log('\n=== Version Durumu ===');
if (verRes.body?.data) {
  console.log(`  State: ${verRes.body.data.attributes.appStoreState}`);
  console.log(`  Version: ${verRes.body.data.attributes.versionString}`);
}
