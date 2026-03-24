/**
 * App Store Connect Screenshot Upload Script
 * 100 mockup → iPhone 6.9" + iPad 13" → 5 dil
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MOCKUPS_DIR = path.join(ROOT, 'store-deployment', 'screenshots', 'mockups');

// ── Config ────────────────────────────────────────────────
const KEY_PATH = path.join(ROOT, 'AuthKey_3Y4L9XJC76.p8');
const KEY_ID = '3Y4L9XJC76';
const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';
const VERSION_ID = '33d8c9a6-81aa-446c-939f-3f9a86a632f8'; // iOS REJECTED version
const BASE_URL = 'api.appstoreconnect.apple.com';

// Locale → localization ID mapping (iOS version)
const LOCALE_MAP = {
  'tr':    { locId: '9ffea29a-7d75-40a3-a19f-b836ac04cf2a', locale: 'tr' },
  'en':    { locId: '8e1cb3d2-4a68-45f3-8b03-ce5bf943eab8', locale: 'en-US' },
  'ar':    { locId: '52f733d9-5066-4b42-908e-3fec98639bf4', locale: 'ar-SA' },
  'uk':    { locId: '7c3360ed-4609-4c61-9cac-6644bed33837', locale: 'uk' },
  'ru':    { locId: '09f21eb6-09dd-4986-ab00-ccb4d8e0fb57', locale: 'ru' },
};

// Device → displayType mapping
const DEVICE_MAP = {
  'appstore-6.9':   { displayType: 'APP_IPHONE_67', label: 'iPhone 6.9"' },
  'appstore-ipad-13': { displayType: 'APP_IPAD_PRO_3GEN_129', label: 'iPad 13"' },
};

const LANGUAGES = ['tr', 'en', 'ar', 'ru', 'uk'];
const DEVICES = ['appstore-6.9', 'appstore-ipad-13'];

// ── JWT ───────────────────────────────────────────────────
function getToken() {
  const { createPrivateKey, sign } = crypto;
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

// ── HTTP helpers ──────────────────────────────────────────
function apiRequest(method, path, body, token, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const options = {
      hostname: BASE_URL,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function uploadBinary(uploadUrl, buffer) {
  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Get or create screenshot set ─────────────────────────
async function getOrCreateScreenshotSet(locId, displayType, token) {
  // Mevcut setleri kontrol et
  const existing = await apiRequest('GET',
    `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets?fields%5BappScreenshotSets%5D=screenshotDisplayType`,
    null, token);

  if (existing.status === 200 && existing.body?.data) {
    const found = existing.body.data.find(s => s.attributes.screenshotDisplayType === displayType);
    if (found) return found.id;
  }

  // Yoksa oluştur
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
    throw new Error(`Screenshot set oluşturulamadı: ${JSON.stringify(created.body).slice(0, 200)}`);
  }
  return created.body.data.id;
}

// ── Upload single screenshot ──────────────────────────────
async function uploadScreenshot(screenshotSetId, filePath, position, token) {
  const buffer = fs.readFileSync(filePath);
  const fileSize = buffer.length;
  const fileName = path.basename(filePath);
  const md5 = crypto.createHash('md5').update(buffer).digest('base64');

  // 1. Upload reservation
  let reserveRes;
  for (let attempt = 0; attempt < 3; attempt++) {
    reserveRes = await apiRequest('POST', '/v1/appScreenshots', {
      data: {
        type: 'appScreenshots',
        attributes: { fileSize, fileName },
        relationships: {
          appScreenshotSet: {
            data: { type: 'appScreenshotSets', id: screenshotSetId }
          }
        }
      }
    }, token);

    if (reserveRes.status === 201) break;
    await sleep(3000);
  }

  if (reserveRes.status !== 201) {
    throw new Error(`Upload reservation başarısız (${reserveRes.status}): ${JSON.stringify(reserveRes.body).slice(0, 200)}`);
  }

  const screenshotId = reserveRes.body.data.id;
  const uploadOps = reserveRes.body.data.attributes.uploadOperations;

  // 2. Binary yükle
  for (const op of uploadOps) {
    const chunk = buffer.slice(op.offset, op.offset + op.length);
    const uploadHeaders = {};
    if (op.requestHeaders) {
      op.requestHeaders.forEach(h => { uploadHeaders[h.name] = h.value; });
    }

    const uploadRes = await new Promise((resolve, reject) => {
      const url = new URL(op.url);
      const chunkBuf = Buffer.from(chunk);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: op.method || 'PUT',
        headers: {
          'Content-Length': chunkBuf.length,
          ...uploadHeaders,
        },
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

    if (uploadRes.status >= 400) {
      throw new Error(`Binary upload başarısız: ${uploadRes.status}`);
    }
  }

  // 3. Commit (MD5 ile)
  let commitRes;
  for (let attempt = 0; attempt < 4; attempt++) {
    commitRes = await apiRequest('PATCH', `/v1/appScreenshots/${screenshotId}`, {
      data: {
        type: 'appScreenshots',
        id: screenshotId,
        attributes: { uploaded: true, sourceFileChecksum: md5 }
      }
    }, token);

    if (commitRes.status < 500) break;
    console.log(`      ⟳ MD5 commit retry ${attempt + 1}/3...`);
    await sleep(5000);
  }

  if (commitRes.status >= 400) {
    console.warn(`      ⚠ Commit uyarısı (${commitRes.status}) — devam ediliyor`);
  }

  return screenshotId;
}

// ── Clear existing screenshots in a set ───────────────────
async function clearScreenshotSet(setId, token) {
  const existing = await apiRequest('GET',
    `/v1/appScreenshotSets/${setId}/appScreenshots?fields%5BappScreenshots%5D=fileName`,
    null, token);

  if (existing.status !== 200 || !existing.body?.data?.length) return;

  for (const ss of existing.body.data) {
    await apiRequest('DELETE', `/v1/appScreenshots/${ss.id}`, null, token);
    await sleep(200);
  }
}

// ── Main upload pipeline ──────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  App Store Connect Screenshot Upload             ║');
  console.log('║  2 cihaz × 5 dil × 10 ekran = 100 screenshot   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  let token = getToken();
  let tokenCreatedAt = Date.now();

  const results = { success: 0, failed: 0, errors: [] };

  for (const deviceKey of DEVICES) {
    const deviceConf = DEVICE_MAP[deviceKey];
    console.log(`\n══ ${deviceConf.label} (${deviceConf.displayType}) ══`);

    for (const lang of LANGUAGES) {
      const langConf = LOCALE_MAP[lang];
      console.log(`\n  [${lang.toUpperCase()}] ${langConf.locale}`);

      // Token yenile (20dk geçerse)
      if (Date.now() - tokenCreatedAt > 18 * 60 * 1000) {
        token = getToken();
        tokenCreatedAt = Date.now();
        console.log('  🔄 JWT yenilendi');
      }

      const mockupDir = path.join(MOCKUPS_DIR, deviceKey, lang);
      if (!fs.existsSync(mockupDir)) {
        console.log(`  ⚠ Dizin yok: ${mockupDir}`);
        continue;
      }

      try {
        // Screenshot set al veya oluştur
        const setId = await getOrCreateScreenshotSet(langConf.locId, deviceConf.displayType, token);
        console.log(`  ✓ Set ID: ${setId}`);

        // Mevcut screenshot'ları temizle
        await clearScreenshotSet(setId, token);

        // Dosyaları sırala
        const files = fs.readdirSync(mockupDir)
          .filter(f => f.endsWith('.png'))
          .sort();

        for (let i = 0; i < files.length; i++) {
          const filePath = path.join(mockupDir, files[i]);
          const position = i + 1;
          await uploadScreenshot(setId, filePath, position, token);
          console.log(`    ✓ [${position}/${files.length}] ${files[i]}`);
          results.success++;
          await sleep(300);
        }

      } catch (err) {
        console.error(`  ✗ HATA [${lang}/${deviceKey}]: ${err.message}`);
        results.failed++;
        results.errors.push({ lang, deviceKey, error: err.message });
      }
    }
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  SONUÇ                                           ║');
  console.log(`║  Başarılı: ${String(results.success).padEnd(40)} ║`);
  console.log(`║  Başarısız: ${String(results.failed).padEnd(39)} ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (results.errors.length > 0) {
    console.log('\nHATALAR:');
    results.errors.forEach(e => console.log(`  ${e.lang}/${e.deviceKey}: ${e.error}`));
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
