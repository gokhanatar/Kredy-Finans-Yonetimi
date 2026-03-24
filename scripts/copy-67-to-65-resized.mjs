import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { createHash } from 'crypto';
import sharp from 'sharp';

const KEY_PATH = '/Users/neslihan/Desktop/uygulama/Kredy/AuthKey_3Y4L9XJC76.p8';
const KEY_ID = '3Y4L9XJC76';
const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';
const VERSION_ID = '33d8c9a6-81aa-446c-939f-3f9a86a632f8';

// 6.5" boyutu: 1284x2778
const TARGET_W = 1284;
const TARGET_H = 2778;

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
      if (res.statusCode === 301 || res.statusCode === 302) return downloadFile(res.headers.location).then(resolve).catch(reject);
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
    const options = { hostname: url.hostname, path: url.pathname + url.search, method: 'PUT', headers: { 'Content-Type': 'image/png', 'Content-Length': buffer.length } };
    const req = (url.protocol === 'https:' ? https : http).request(options, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', reject); req.write(buffer); req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let token = getToken();
let tokenCreatedAt = Date.now();
function refreshToken() {
  if (Date.now() - tokenCreatedAt > 18 * 60 * 1000) { token = getToken(); tokenCreatedAt = Date.now(); }
}

const locRes = await apiReq('GET', `/v1/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations?limit=20`, null, token);
const locs = locRes.body?.data || [];

for (const loc of locs) {
  const locale = loc.attributes?.locale;
  const setsRes = await apiReq('GET', `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets?limit=20`, null, token);
  const sets = setsRes.body?.data || [];
  const setMap = {};
  for (const s of sets) setMap[s.attributes?.screenshotDisplayType] = s;

  const sourceSet = setMap['APP_IPHONE_67'];
  const targetSet = setMap['APP_IPHONE_65'];

  if (!sourceSet || !targetSet) { console.log(`${locale}: set eksik, atlanıyor`); continue; }

  // Hedef sette zaten screenshot var mı?
  const targetSSRes = await apiReq('GET', `/v1/appScreenshotSets/${targetSet.id}/appScreenshots?limit=5`, null, token);
  const targetCount = targetSSRes.body?.data?.length || 0;
  if (targetCount >= 2) { console.log(`${locale}: zaten ${targetCount} screenshot var`); continue; }

  // Kaynak 6.7" screenshotları al
  const sourceSSRes = await apiReq('GET', `/v1/appScreenshotSets/${sourceSet.id}/appScreenshots?limit=5`, null, token);
  const sourceScreenshots = (sourceSSRes.body?.data || []).slice(0, 3);

  if (sourceScreenshots.length === 0) { console.log(`${locale}: kaynak screenshot yok`); continue; }

  console.log(`\n${locale}: ${sourceScreenshots.length} screenshot 6.7" → 6.5" resize+kopyalanıyor...`);

  for (const ss of sourceScreenshots) {
    refreshToken();
    const templateUrl = ss.attributes?.imageAsset?.templateUrl;
    if (!templateUrl) { console.log('  template URL yok, atlanıyor'); continue; }

    const imgW = ss.attributes?.imageAsset?.width || 1290;
    const imgH = ss.attributes?.imageAsset?.height || 2796;
    const imgUrl = templateUrl.replace('{w}', imgW).replace('{h}', imgH).replace('{f}', 'jpg');

    // Download
    const rawBuffer = await downloadFile(imgUrl).catch(e => { console.log(`  download hata: ${e.message}`); return null; });
    if (!rawBuffer) continue;

    // Sharp ile 1284x2778'e resize (6.5" boyutu)
    const resizedBuffer = await sharp(rawBuffer)
      .resize(TARGET_W, TARGET_H, { fit: 'fill' })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toBuffer();

    const fileName = `screenshot_65_${Date.now()}.png`;
    const md5 = createHash('md5').update(resizedBuffer).digest('hex');

    // Upload reservation
    const reserveRes = await apiReq('POST', '/v1/appScreenshots', {
      data: {
        type: 'appScreenshots',
        attributes: { fileName, fileSize: resizedBuffer.length },
        relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: targetSet.id } } }
      }
    }, token);

    if (reserveRes.status !== 201) {
      console.log(`  reserve hata: ${reserveRes.status} — ${JSON.stringify(reserveRes.body?.errors?.[0]?.detail || '').slice(0, 80)}`);
      continue;
    }

    const screenshotId = reserveRes.body?.data?.id;
    const ops = reserveRes.body?.data?.attributes?.uploadOperations || [];

    // Binary upload
    for (const op of ops) {
      const chunk = resizedBuffer.slice(op.offset, op.offset + op.length);
      await uploadBinary(op.url, chunk);
    }

    await sleep(500);

    // PATCH: mark uploaded
    for (let retry = 0; retry < 3; retry++) {
      const patchRes = await apiReq('PATCH', `/v1/appScreenshots/${screenshotId}`, {
        data: { type: 'appScreenshots', id: screenshotId, attributes: { uploaded: true, sourceFileChecksum: md5 } }
      }, token);

      if (patchRes.status < 300) { console.log(`  ✅ kopyalandı (${TARGET_W}x${TARGET_H})`); break; }
      else if (retry < 2) { await sleep(5000); }
      else { console.log(`  ❌ PATCH hata: ${patchRes.status}`); }
    }

    await sleep(1000);
  }
}

console.log('\n✅ Tamamlandı');
