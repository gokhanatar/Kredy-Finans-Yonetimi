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
  const sig = crypto.sign('sha256', Buffer.from(`${header}.${payload}`), { key: key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${header}.${payload}.${sig}`;
}

function apiRequest(method, reqPath, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({ hostname: 'api.appstoreconnect.apple.com', path: reqPath, method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}) } }, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', reject); if (bodyStr) req.write(bodyStr); req.end();
  });
}

const token = getToken();

// Tüm lokalizasyonları + set'lerini listele
const locRes = await apiRequest('GET', `/v1/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations?limit=10`, null, token);

for (const loc of (locRes.body?.data || [])) {
  const locale = loc.attributes?.locale;
  console.log(`\n--- ${locale} ---`);

  const setsRes = await apiRequest('GET', `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets?limit=20`, null, token);
  for (const set of (setsRes.body?.data || [])) {
    const count = set.attributes?.screenshotCount ?? '?';
    console.log(`  ${set.attributes?.screenshotDisplayType}: ${count} screenshot (${set.id})`);
  }
}
