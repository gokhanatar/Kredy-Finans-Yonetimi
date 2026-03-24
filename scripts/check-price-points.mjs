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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const token = getToken();

// Mevcut Monthly fiyatları - tam detay
console.log('=== Monthly mevcut price entries (detay) ===');
const monthlyPricesDetailed = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}/prices?include=subscriptionPricePoint&fields[subscriptionPricePoints]=customerPrice,proceeds,territory&limit=20`,
  null, token);

if (monthlyPricesDetailed.body?.data) {
  for (const price of monthlyPricesDetailed.body.data) {
    const pp = monthlyPricesDetailed.body.included?.find(i => i.id === price.relationships?.subscriptionPricePoint?.data?.id);
    console.log(`  ${price.id}: territory=${pp?.relationships?.territory?.data?.id || '?'} price=$${pp?.attributes?.customerPrice || '?'}`);
  }
}

// Mevcut price'ları SİL ve yeniden doğru fiyatla ayarla
console.log('\n=== Monthly US fiyat noktaları ($1.99 için) ===');
const usPoints = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}/pricePoints?filter[territory]=USA&limit=50`,
  null, token);

let target199;
if (usPoints.body?.data) {
  usPoints.body.data.slice(0, 20).forEach(pp => {
    console.log(`  ${pp.id}: $${pp.attributes?.customerPrice} → $${pp.attributes?.proceeds}`);
    if (pp.attributes?.customerPrice === '1.99') target199 = pp.id;
  });
}
console.log(`\nHedef $1.99 ID: ${target199 || 'BULUNAMADI'}`);

// Yearly US fiyat noktaları ($9.99)
console.log('\n=== Yearly US fiyat noktaları ($9.99 için) ===');
const usYearlyPoints = await apiRequest('GET',
  `/v1/subscriptions/${YEARLY_SUB_ID}/pricePoints?filter[territory]=USA&limit=50`,
  null, token);

let target999;
if (usYearlyPoints.body?.data) {
  usYearlyPoints.body.data.slice(0, 20).forEach(pp => {
    console.log(`  ${pp.id}: $${pp.attributes?.customerPrice} → $${pp.attributes?.proceeds}`);
    if (pp.attributes?.customerPrice === '9.99') target999 = pp.id;
  });
}
console.log(`\nHedef $9.99 ID: ${target999 || 'BULUNAMADI'}`);

// Mevcut price'ların ilişkili subscriptionPricePoint'leri al
console.log('\n=== Mevcut price relationships ===');
const mPriceRel = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}/prices?include=subscriptionPricePoint&fields[subscriptionPricePoints]=customerPrice,proceeds,territory&limit=10`,
  null, token);
console.log('Monthly prices raw:');
console.log(JSON.stringify(mPriceRel.body, null, 2).slice(0, 1000));
