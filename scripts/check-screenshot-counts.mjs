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

const token = getToken();

// Bilinen set ID'leri — her dil için APP_IPHONE_67 setinin içindeki screenshot sayısı
const SETS = {
  'tr-iPhone67': '00bd59c3-d432-4463-9b38-ff27af9d0baf',
  'tr-iPad13':   '5bc8f633-706f-4411-b5f5-c4777bb6eca8',
  'en-iPhone67': '7cb38b7d-4491-499e-a52d-7db359f2b7b0',
  'en-iPad13':   '07b05d5b-24e2-4f83-8a90-9b7ffe503253',
  'ar-iPhone67': '539d64e0-5a3d-4cbe-b47b-fb59f9bf7ec4',
  'ar-iPad13':   '05ab64b0-5eb6-44c5-a5cb-59905677f6f9',
  'ru-iPhone67': '039951be-4344-49bb-9a6e-0b4fa54607c0',
  'ru-iPad13':   '2b9a1248-7046-4914-a679-cc2be7bcf1e7',
  'uk-iPhone67': 'f581d87f-680e-4240-9c2f-fe08d83ebc8c',
  'uk-iPad13':   '7485d3a6-3274-4d0e-8857-20016a06bdf8',
};

console.log('=== Screenshot sayıları ===');
for (const [name, setId] of Object.entries(SETS)) {
  const res = await apiReq('GET', `/v1/appScreenshotSets/${setId}/appScreenshots?limit=15`, null, token);
  const count = res.body?.data?.length ?? 0;
  const total = res.body?.meta?.paging?.total ?? count;
  const status = total >= 10 ? '✅' : total > 0 ? `⚠️ (${total}/10)` : '❌ BOŞ';
  console.log(`  ${name}: ${total} screenshot ${status}`);
}
