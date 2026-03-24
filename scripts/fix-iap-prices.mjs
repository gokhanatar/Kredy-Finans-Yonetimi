/**
 * Eksik ülke fiyatlarını bul ve ayarla
 * ZORUNLU: Tüm ülkeler için fiyat ayarlanmalı
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const token = getToken();

// Tam hata mesajını al
console.log('=== Eksik fiyat ülkeleri (Monthly) ===');
const monthlySubmit = await apiRequest('POST', `/v1/subscriptionSubmissions`, {
  data: {
    type: 'subscriptionSubmissions',
    relationships: {
      subscription: { data: { type: 'subscriptions', id: MONTHLY_SUB_ID } }
    }
  }
}, token);
const monthlyError = monthlySubmit.body?.errors?.[0]?.detail || '';
console.log('Tam hata:', monthlyError.slice(0, 2000));

console.log('\n=== Eksik fiyat ülkeleri (Yearly) ===');
const yearlySubmit = await apiRequest('POST', `/v1/subscriptionSubmissions`, {
  data: {
    type: 'subscriptionSubmissions',
    relationships: {
      subscription: { data: { type: 'subscriptions', id: YEARLY_SUB_ID } }
    }
  }
}, token);
const yearlyError = yearlySubmit.body?.errors?.[0]?.detail || '';
console.log('Tam hata:', yearlyError.slice(0, 2000));

// Hangi ülkeler eksik?
// Hata mesajından ülke listesini çıkar
const missingTerritories = monthlyError.match(/\(([\w, ]+)\)/)?.[1]?.split(', ') || [];
console.log(`\nMissing territories (${missingTerritories.length}):`);
console.log(missingTerritories.join(', '));

// US'te mevcut fiyat noktasını al ve diğer ülkelere de uygula
// Strateji: equalToBase = true ile tüm ülkelere USD bazlı fiyat yay
console.log('\n=== Mevcut Monthly pricePoints (US) - tam ===');
const monthlyPP = await apiRequest('GET',
  `/v1/subscriptions/${MONTHLY_SUB_ID}/pricePoints?filter[territory]=USA&limit=200`,
  null, token);

// $1.99 tier'ını bul
let pp199Id = null;
if (monthlyPP.body?.data) {
  const found = monthlyPP.body.data.find(p => p.attributes?.customerPrice === '1.99');
  if (found) {
    pp199Id = found.id;
    console.log(`$1.99 pricePoint ID: ${pp199Id}`);
  } else {
    // Liste sayfada olmayabilir, daha fazlasını çek
    const pp2 = await apiRequest('GET',
      `/v1/subscriptions/${MONTHLY_SUB_ID}/pricePoints?filter[territory]=USA&limit=200&cursor=200`,
      null, token);
    if (pp2.body?.data) {
      const f2 = pp2.body.data.find(p => p.attributes?.customerPrice === '1.99');
      if (f2) pp199Id = f2.id;
    }
    console.log('$1.99 bulunamadı, en yakın gösteriliyor...');
    monthlyPP.body.data.slice(18, 25).forEach(p =>
      console.log(`  $${p.attributes?.customerPrice}: ${p.id}`)
    );
  }
}

// Çözüm: subscriptionPriceSchedule API ile tüm ülkelere global fiyat yay
// POST /v1/subscriptions/{id}/subscriptionPriceSchedule
// Bu API global price points ile tüm ülkeleri tek seferde ayarlıyor

if (pp199Id) {
  console.log('\n=== Global price schedule ayarlama (Monthly $1.99) ===');
  const priceScheduleRes = await apiRequest('POST', `/v1/subscriptionPriceSchedules`, {
    data: {
      type: 'subscriptionPriceSchedules',
      attributes: {},
      relationships: {
        subscription: { data: { type: 'subscriptions', id: MONTHLY_SUB_ID } },
        baseTerritory: { data: { type: 'territories', id: 'USA' } },
        automaticRenewedCurrencyBaseTerritory: { data: { type: 'territories', id: 'USA' } },
        manualPrices: {
          data: [{ type: 'subscriptionPricePoints', id: pp199Id }]
        },
      }
    }
  }, token);
  console.log(`Status: ${priceScheduleRes.status}`);
  console.log(JSON.stringify(priceScheduleRes.body).slice(0, 500));
}
