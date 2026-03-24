/**
 * Subscription'ın neden submit edilemiyor olduğunu bul
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

// 1. Her subscription'ın tam state + reviewState bilgisi
console.log('=== Subscription durumları ===');
for (const [name, subId] of [['Monthly', MONTHLY_SUB_ID], ['Yearly', YEARLY_SUB_ID]]) {
  const res = await apiRequest('GET', `/v1/subscriptions/${subId}?fields[subscriptions]=state,productId,subscriptionPeriod,reviewNote,familySharable,groupLevel,introductoryOffers,promotionalOffers,subscriptionLocalizations,prices`, null, token);
  const attrs = res.body?.data?.attributes;
  console.log(`\n${name} (${subId}):`);
  console.log(`  state: ${attrs?.state}`);
  console.log(`  productId: ${attrs?.productId}`);
  console.log(`  reviewNote: ${attrs?.reviewNote || '(boş)'}`);
  console.log(`  familySharable: ${attrs?.familySharable}`);
  console.log(`  groupLevel: ${attrs?.groupLevel}`);
}

// 2. Submit response'nun tam body'sini gör
console.log('\n=== Monthly submit — tam response ===');
const mSub = await apiRequest('POST', '/v1/subscriptionSubmissions', {
  data: {
    type: 'subscriptionSubmissions',
    relationships: { subscription: { data: { type: 'subscriptions', id: MONTHLY_SUB_ID } } }
  }
}, token);
console.log(`Status: ${mSub.status}`);
console.log(JSON.stringify(mSub.body, null, 2).slice(0, 2000));

// 3. Fiyat sayısını kontrol et
console.log('\n=== Monthly fiyat sayısı ===');
const mPrices = await apiRequest('GET', `/v1/subscriptions/${MONTHLY_SUB_ID}/prices?limit=200`, null, token);
console.log(`Fiyat sayısı: ${mPrices.body?.data?.length || 0}`);
if (mPrices.body?.meta?.paging) console.log('Paging:', JSON.stringify(mPrices.body.meta.paging));

const yPrices = await apiRequest('GET', `/v1/subscriptions/${YEARLY_SUB_ID}/prices?limit=200`, null, token);
console.log(`Yearly fiyat sayısı: ${yPrices.body?.data?.length || 0}`);

// 4. Subscription localizations içeriği
console.log('\n=== Monthly localizations ===');
const mLocs = await apiRequest('GET', `/v1/subscriptions/${MONTHLY_SUB_ID}/subscriptionLocalizations`, null, token);
mLocs.body?.data?.forEach(l => {
  const a = l.attributes;
  console.log(`  ${a.locale}: name="${a.name}" | desc=${!!a.description}`);
});
