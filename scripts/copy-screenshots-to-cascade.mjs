/**
 * 6.7" screenshotları 6.5" setine, 3GEN_129'ı 12.9" setine kopyala
 * Sadece en-US için (spot check için yeterli — diğer diller cascade)
 *
 * STRATEJI: Her 6.7" screenshot'ı download et → 6.5" setine re-upload et
 */
import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import { createHash } from 'crypto';
import os from 'os';

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

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function uploadBinary(uploadUrl, buffer) {
  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PUT',
      headers: { 'Content-Type': 'image/png', 'Content-Length': buffer.length },
    };
    const req = (url.protocol === 'https:' ? https : http).request(options, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let token = getToken();
let tokenCreatedAt = Date.now();

function refreshToken() {
  if (Date.now() - tokenCreatedAt > 18 * 60 * 1000) {
    token = getToken();
    tokenCreatedAt = Date.now();
  }
}

// Lokalizasyonları al
const locRes = await apiReq('GET', `/v1/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations?limit=10`, null, token);
const localizations = locRes.body?.data || [];

// Copy mappings: source type → target type
const COPY_PAIRS = [
  { from: 'APP_IPHONE_67', to: 'APP_IPHONE_65' },
  { from: 'APP_IPAD_PRO_3GEN_129', to: 'APP_IPAD_PRO_129' },
];

for (const loc of localizations) {
  const locale = loc.attributes?.locale;
  console.log(`\n--- ${locale} ---`);

  // Mevcut setleri al
  const setsRes = await apiReq('GET', `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets?limit=20`, null, token);
  const sets = setsRes.body?.data || [];
  const setMap = {};
  for (const s of sets) setMap[s.attributes?.screenshotDisplayType] = s;

  for (const { from, to } of COPY_PAIRS) {
    const sourceSet = setMap[from];
    const targetSet = setMap[to];

    if (!sourceSet) { console.log(`  ${to}: source set (${from}) yok, atlanıyor`); continue; }
    if (!targetSet) { console.log(`  ${to}: target set yok, atlanıyor`); continue; }

    // Target set'in mevcut screenshot sayısını kontrol et
    const targetSSRes = await apiReq('GET', `/v1/appScreenshotSets/${targetSet.id}/appScreenshots?limit=15`, null, token);
    const targetCount = targetSSRes.body?.data?.length || 0;

    if (targetCount >= 2) {
      console.log(`  ${to}: zaten ${targetCount} screenshot var`);
      continue;
    }

    // Source set'teki screenshotları al
    const sourceSSRes = await apiReq('GET', `/v1/appScreenshotSets/${sourceSet.id}/appScreenshots?limit=15`, null, token);
    const sourceScreenshots = sourceSSRes.body?.data || [];

    if (sourceScreenshots.length === 0) {
      console.log(`  ${from}: source screenshot yok`);
      continue;
    }

    // İlk 3 screenshotu kopyala (min 2 gerekiyor)
    const toCopy = sourceScreenshots.slice(0, 3);
    console.log(`  ${to}: ${toCopy.length} screenshot kopyalanıyor...`);

    for (const ss of toCopy) {
      refreshToken();
      // templateUrl: ".../{w}x{h}bb.{f}" → tam URL için boyutu ver
      const templateUrl = ss.attributes?.imageAsset?.templateUrl;
      if (!templateUrl) { console.log(`    screenshot URL yok, atlanıyor`); continue; }
      const imgW = ss.attributes?.imageAsset?.width || 1260;
      const imgH = ss.attributes?.imageAsset?.height || 2736;
      const imgUrl = templateUrl.replace('{w}', imgW).replace('{h}', imgH).replace('{f}', 'png').replace('bb.png', 'png');

      // 1. Download
      const imgBuffer = await downloadFile(imgUrl).catch(e => { console.log(`    download hata: ${e.message}`); return null; });
      if (!imgBuffer) continue;

      const fileName = `screenshot_${to}_${Date.now()}.png`;
      const md5 = createHash('md5').update(imgBuffer).digest('hex');

      // 2. Upload reservation
      const reserveRes = await apiReq('POST', '/v1/appScreenshots', {
        data: {
          type: 'appScreenshots',
          attributes: { fileName, fileSize: imgBuffer.length },
          relationships: {
            appScreenshotSet: { data: { type: 'appScreenshotSets', id: targetSet.id } }
          }
        }
      }, token);

      if (reserveRes.status !== 201) {
        console.log(`    reserve hata: ${reserveRes.status} — ${JSON.stringify(reserveRes.body?.errors?.[0]?.detail || '').slice(0, 80)}`);
        continue;
      }

      const screenshotId = reserveRes.body?.data?.id;
      const ops = reserveRes.body?.data?.attributes?.uploadOperations || [];

      // 3. Upload binary
      for (const op of ops) {
        const chunk = imgBuffer.slice(op.offset, op.offset + op.length);
        const upRes = await uploadBinary(op.url, chunk);
        if (upRes.status > 299) console.log(`    upload hata: ${upRes.status}`);
      }

      await sleep(500);

      // 4. PATCH: mark uploaded
      for (let retry = 0; retry < 3; retry++) {
        const patchRes = await apiReq('PATCH', `/v1/appScreenshots/${screenshotId}`, {
          data: {
            type: 'appScreenshots',
            id: screenshotId,
            attributes: { uploaded: true, sourceFileChecksum: md5 }
          }
        }, token);

        if (patchRes.status < 300) {
          console.log(`    ✅ kopyalandı`);
          break;
        } else if (retry < 2) {
          await sleep(5000);
        } else {
          console.log(`    ❌ PATCH hata: ${patchRes.status}`);
        }
      }

      await sleep(1000);
    }
  }
}

console.log('\n✅ Tamamlandı');
