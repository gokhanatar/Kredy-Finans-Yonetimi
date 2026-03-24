/**
 * Apple cascade scaling için eksik screenshot setlerini oluştur
 * APP_IPHONE_65 ve APP_IPAD_PRO_129
 * Bu setler boş olabilir — Apple 6.7" ve 3GEN_129'dan otomatik scale eder
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
const VERSION_ID = '33d8c9a6-81aa-446c-939f-3f9a86a632f8';

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const token = getToken();

// Lokalizasyonları al
const locRes = await apiReq('GET', `/v1/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations?limit=10`, null, token);
const localizations = locRes.body?.data || [];

console.log(`${localizations.length} lokalizasyon bulundu`);

// Her dil için eksik setleri oluştur
const targetTypes = ['APP_IPHONE_65', 'APP_IPAD_PRO_129'];

for (const loc of localizations) {
  const locale = loc.attributes?.locale;
  const locId = loc.id;

  // Mevcut setleri al
  const setsRes = await apiReq('GET', `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets?limit=20`, null, token);
  const existingTypes = new Set((setsRes.body?.data || []).map(s => s.attributes?.screenshotDisplayType));

  for (const type of targetTypes) {
    if (existingTypes.has(type)) {
      console.log(`  ${locale} / ${type}: zaten var`);
      continue;
    }

    const createRes = await apiReq('POST', '/v1/appScreenshotSets', {
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
      console.log(`  ✅ ${locale} / ${type} seti oluşturuldu`);
    } else if (createRes.status === 409) {
      console.log(`  ${locale} / ${type}: zaten var (409)`);
    } else {
      const err = createRes.body?.errors?.[0]?.detail || JSON.stringify(createRes.body);
      console.log(`  ❌ ${locale} / ${type}: ${createRes.status} — ${err.slice(0, 100)}`);
    }

    await sleep(300);
  }
}

console.log('\n✅ Tamamlandı');
