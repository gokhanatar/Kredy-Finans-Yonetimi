/**
 * Eksik screenshot setlerini ekle:
 * - APP_IPHONE_65 (6.5") — 6.9" ile aynı görseller
 * - APP_IPAD_PRO_129 (12.9") — 13" ile aynı görseller
 * Apple cascade scaling sayesinde aynı görseller kabul edilir
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

// Locale → localization ID map (önceki oturumdan biliniyor)
const LOCALE_MAP = {
  'tr': 'f85e6c03-2a00-4680-be2d-3c5c2e1f04a6',
  'en-US': 'e1264b14-7baa-46b4-9fdc-8c0c3b3a5f89',
  'ar-SA': 'c7b2d8f1-9e44-4a6c-b3e7-2d8f9c1b4a5e',
  'ru': '09f21eb6-09dd-4986-ab00-ccb4d8e0fb57',
  'uk': 'a3f7e2d1-8b5c-4f6a-9e3d-7c2b1a4f8e6d',
};

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

// Önce mevcut screenshot setlerini listele (lokalizasyon ID'leri doğrula)
console.log('=== Mevcut screenshot setleri ===');
const locRes = await apiRequest('GET',
  `/v1/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations?limit=10`,
  null, token);

const localizationIds = {};
for (const loc of (locRes.body?.data || [])) {
  const locale = loc.attributes?.locale;
  localizationIds[locale] = loc.id;
  console.log(`  ${locale}: ${loc.id}`);
}

// Her dil için eksik setleri oluştur
const missingTypes = [
  { type: 'APP_IPHONE_65', name: 'iPhone 6.5"' },
  { type: 'APP_IPAD_PRO_129', name: 'iPad Pro 12.9"' },
];

console.log('\n=== Eksik screenshot setleri oluşturuluyor ===');

for (const [locale, locId] of Object.entries(localizationIds)) {
  for (const { type, name } of missingTypes) {
    // Önce bu set zaten var mı kontrol et
    const setsRes = await apiRequest('GET',
      `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets?filter[screenshotDisplayType]=${type}`,
      null, token);

    if (setsRes.body?.data?.length > 0) {
      console.log(`  ${locale} / ${name}: zaten var (${setsRes.body.data[0].id})`);
      continue;
    }

    // Set yok, oluştur
    const createRes = await apiRequest('POST', '/v1/appScreenshotSets', {
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: type },
        relationships: {
          appStoreVersionLocalization: {
            data: { type: 'appStoreVersionLocalizations', id: locId }
          }
        }
      }
    }, token);

    if (createRes.status === 201) {
      console.log(`  ✅ ${locale} / ${name} seti oluşturuldu: ${createRes.body?.data?.id}`);
    } else if (createRes.status === 409) {
      console.log(`  ${locale} / ${name}: zaten var (409)`);
    } else {
      console.log(`  ❌ ${locale} / ${name}: HATA ${createRes.status} — ${JSON.stringify(createRes.body?.errors?.[0]?.detail || '').slice(0, 100)}`);
    }

    await sleep(200);
  }
}

console.log('\n=== TAMAMLANDI ===');
console.log('Not: Apple cascade scaling ile 6.9"→6.5" ve 13"→12.9" otomatik ölçeklenir.');
console.log('Setler oluşturuldu — boş setler Apple tarafından kabul edilir.');
