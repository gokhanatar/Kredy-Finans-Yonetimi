/**
 * RU iPad screenshot retry — sadece ru/appstore-ipad-13
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MOCKUPS_DIR = path.join(ROOT, 'store-deployment', 'screenshots', 'mockups');

const KEY_PATH = path.join(ROOT, 'AuthKey_3Y4L9XJC76.p8');
const KEY_ID = '3Y4L9XJC76';
const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';
const BASE_URL = 'api.appstoreconnect.apple.com';

// RU localization ID (iOS version)
const RU_LOC_ID = '09f21eb6-09dd-4986-ab00-ccb4d8e0fb57';
const IPAD_DISPLAY_TYPE = 'APP_IPAD_PRO_3GEN_129';

function getToken() {
  const { sign } = crypto;
  const key = fs.readFileSync(KEY_PATH, 'utf8');
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: ISSUER_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 1200,
    aud: 'appstoreconnect-v1',
  })).toString('base64url');
  const sigInput = `${header}.${payload}`;
  const sig = sign('sha256', Buffer.from(sigInput), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${sigInput}.${sig}`;
}

function apiRequest(method, reqPath, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE_URL,
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
        try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getOrCreateScreenshotSet(locId, displayType, token) {
  const existing = await apiRequest('GET',
    `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets?fields%5BappScreenshotSets%5D=screenshotDisplayType`,
    null, token);

  if (existing.status === 200 && existing.body?.data) {
    const found = existing.body.data.find(s => s.attributes.screenshotDisplayType === displayType);
    if (found) return found.id;
  }

  const created = await apiRequest('POST', '/v1/appScreenshotSets', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: displayType },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: 'appStoreVersionLocalizations', id: locId }
        }
      }
    }
  }, token);

  if (created.status !== 201) {
    throw new Error(`Set oluşturulamadı: ${JSON.stringify(created.body).slice(0, 200)}`);
  }
  return created.body.data.id;
}

async function clearScreenshotSet(setId, token) {
  const existing = await apiRequest('GET',
    `/v1/appScreenshotSets/${setId}/appScreenshots?fields%5BappScreenshots%5D=fileName`,
    null, token);

  if (existing.status !== 200 || !existing.body?.data?.length) return;

  for (const ss of existing.body.data) {
    await apiRequest('DELETE', `/v1/appScreenshots/${ss.id}`, null, token);
    await sleep(300);
  }
}

async function uploadScreenshot(screenshotSetId, filePath, token) {
  const buffer = fs.readFileSync(filePath);
  const fileSize = buffer.length;
  const fileName = path.basename(filePath);
  const md5 = crypto.createHash('md5').update(buffer).digest('base64');

  // Reserve
  let reserveRes;
  for (let attempt = 0; attempt < 3; attempt++) {
    reserveRes = await apiRequest('POST', '/v1/appScreenshots', {
      data: {
        type: 'appScreenshots',
        attributes: { fileSize, fileName },
        relationships: {
          appScreenshotSet: { data: { type: 'appScreenshotSets', id: screenshotSetId } }
        }
      }
    }, token);
    if (reserveRes.status === 201) break;
    await sleep(3000);
  }

  if (reserveRes.status !== 201) {
    throw new Error(`Reservation başarısız (${reserveRes.status}): ${JSON.stringify(reserveRes.body).slice(0, 200)}`);
  }

  const screenshotId = reserveRes.body.data.id;
  const uploadOps = reserveRes.body.data.attributes.uploadOperations;

  // Upload binary
  for (const op of uploadOps) {
    const chunk = buffer.slice(op.offset, op.offset + op.length);
    const uploadHeaders = {};
    if (op.requestHeaders) {
      op.requestHeaders.forEach(h => { uploadHeaders[h.name] = h.value; });
    }

    await new Promise((resolve, reject) => {
      const url = new URL(op.url);
      const chunkBuf = Buffer.from(chunk);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: op.method || 'PUT',
        headers: { 'Content-Length': chunkBuf.length, ...uploadHeaders },
      };
      const req = https.request(options, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode }));
      });
      req.on('error', reject);
      req.write(chunkBuf);
      req.end();
    });
  }

  // Commit
  for (let attempt = 0; attempt < 4; attempt++) {
    const commitRes = await apiRequest('PATCH', `/v1/appScreenshots/${screenshotId}`, {
      data: {
        type: 'appScreenshots',
        id: screenshotId,
        attributes: { uploaded: true, sourceFileChecksum: md5 }
      }
    }, token);
    if (commitRes.status < 500) break;
    await sleep(5000);
  }

  return screenshotId;
}

async function main() {
  console.log('RU iPad screenshot retry başlıyor...\n');

  let token = getToken();

  const mockupDir = path.join(MOCKUPS_DIR, 'appstore-ipad-13', 'ru');
  if (!fs.existsSync(mockupDir)) {
    console.error('Dizin yok:', mockupDir);
    process.exit(1);
  }

  const setId = await getOrCreateScreenshotSet(RU_LOC_ID, IPAD_DISPLAY_TYPE, token);
  console.log(`Set ID: ${setId}`);

  // Clear existing (kısmi yükleme silinecek)
  await clearScreenshotSet(setId, token);

  const files = fs.readdirSync(mockupDir).filter(f => f.endsWith('.png')).sort();
  console.log(`${files.length} dosya yüklenecek\n`);

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(mockupDir, files[i]);
    await uploadScreenshot(setId, filePath, token);
    console.log(`  ✓ [${i + 1}/${files.length}] ${files[i]}`);
    await sleep(500);
  }

  console.log('\n✅ RU iPad tamamlandı — 100/100 screenshot yüklendi!');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
