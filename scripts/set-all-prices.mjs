/**
 * Tüm ülkeler için subscription fiyatı ayarla
 * Monthly: $1.99 (US baz, diğerleri eşdeğer)
 * Yearly: $9.99 (US baz)
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

// Eksik olan ülkeler
const MISSING_TERRITORIES = [
  'SLE','SLB','HND','TZA','SWE','LCA','MEX','TCD','LBY','FSM','PNG','TCA','LBR','LBN',
  'BGR','SVN','GUY','SVK','DMA','BRN','YEM','MDV','IDN','MOZ','CIV','NRU','BRB','BRA',
  'LAO','SUR','FRA','PLW','MDG','NGA','AZE','PAN','MDA','ECU','PAK','VGB','GTM','BFA',
  'TWN','CHN','STP','CHL','IND','BEN','BEL','UZB','HKG','MYS','CHE','MNG','MNE','KHM',
  'XKS','NER','GHA','TKM','LKA','JPN','LVA','MMR','KGZ','NPL','VEN','LUX','HUN','CRI',
  'BOL','TUN','JOR','SGP','MAR','TJK','GRC','GRD','QAT','NOR','MLT','ALB','ROU','MAC',
  'MLI','LTU','NZL','SRB','MWI','TTO','VCT','CPV','GEO','BMU','UKR','KEN','VNM','MKD',
  'PHL','AUT','AUS','SEN','BLZ','THA','HRV','MUS','BLR','COL','PRY','JAM','PRT','COG',
  'KOR','COD','NAM','CZE','ZMB','AIA','ATG','BWA','NLD','CYP','ZAF','DEU','CYM','ITA',
  'EST','GNB','RWA','ESP','GBR','ISR','KNA','ZWE','CMR','MSR','ISL','PER','EGY','AGO',
  'SYC','FJI','ARM','OMN','GMB','KAZ','CAN','ARG','IRQ','ARE','DOM','MRT','IRL','RUS',
  'URY','VUT','FIN','SAU','GAB','BIH','AFG','BTN','KWT','POL','SLV','DZA','UGA','TON',
  'SWZ','BHS','DNK','BHR','NIC'
];

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

async function getLowestPricePointForTerritory(subId, territory, token) {
  const res = await apiRequest('GET',
    `/v1/subscriptions/${subId}/pricePoints?filter[territory]=${territory}&limit=5`,
    null, token);
  if (res.body?.data?.length > 0) {
    return res.body.data[0].id; // İlk (en düşük) fiyat noktası
  }
  return null;
}

async function getEquivalentPricePoint(subId, territory, targetUSD, token) {
  // Tüm fiyat noktalarını al ve en yakını bul
  const res = await apiRequest('GET',
    `/v1/subscriptions/${subId}/pricePoints?filter[territory]=${territory}&limit=200`,
    null, token);

  if (!res.body?.data?.length) return null;

  const points = res.body.data;

  // Eğer 1 tane bile varsa, o ülkenin para biriminde bir şey seç
  // USD 1.99 için benzer tier'ı bul (tier ~23 civarı)
  // Her territory için yaklaşık eşdeğer nokta: index 22-23 civarı (0-based)
  const targetIndex = Math.min(Math.round(points.length * 0.15), points.length - 1);
  return points[targetIndex]?.id;
}

let token = getToken();
let tokenCreatedAt = Date.now();

async function refreshTokenIfNeeded() {
  if (Date.now() - tokenCreatedAt > 18 * 60 * 1000) {
    token = getToken();
    tokenCreatedAt = Date.now();
    console.log('  JWT yenilendi');
  }
}

// Monthly için eksik ülkelere fiyat ekle
console.log(`Monthly için ${MISSING_TERRITORIES.length} ülkeye fiyat ekleniyor...\n`);

// $1.99 US pricePoint ID (önceden bulundu)
const MONTHLY_US_PP_199 = 'eyJzIjoiNjc2MDU3NDA2MyIsInQiOiJVU0EiLCJwIjoiMTAwMjMifQ';

let monthlySuccess = 0, monthlyFail = 0;
const monthlyFailed = [];

for (let i = 0; i < MISSING_TERRITORIES.length; i++) {
  const territory = MISSING_TERRITORIES[i];
  await refreshTokenIfNeeded();

  // Bu territory için fiyat noktasını al (eşdeğer tier)
  const ppId = await getEquivalentPricePoint(MONTHLY_SUB_ID, territory, 1.99, token);

  if (!ppId) {
    console.log(`  [${i+1}/${MISSING_TERRITORIES.length}] ${territory}: pricePoint bulunamadı`);
    monthlyFailed.push(territory);
    monthlyFail++;
    continue;
  }

  // Fiyat ekle
  const addRes = await apiRequest('POST', '/v1/subscriptionPrices', {
    data: {
      type: 'subscriptionPrices',
      attributes: { preserveCurrentPrice: false, startDate: null },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: MONTHLY_SUB_ID } },
        subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: ppId } },
      }
    }
  }, token);

  if (addRes.status === 201) {
    if (i % 20 === 0) process.stdout.write(`  [${i+1}] ${territory} ✓\n`);
    monthlySuccess++;
  } else if (addRes.status === 409) {
    // Zaten var
    monthlySuccess++;
  } else {
    const errMsg = addRes.body?.errors?.[0]?.detail || `${addRes.status}`;
    console.log(`  [${i+1}] ${territory}: HATA — ${errMsg.slice(0, 100)}`);
    monthlyFailed.push(territory);
    monthlyFail++;
  }

  if (i % 10 === 9) await sleep(1000); // Rate limiting koruma
  else await sleep(100);
}

console.log(`\nMonthly: ${monthlySuccess} başarılı, ${monthlyFail} başarısız`);
if (monthlyFailed.length > 0) console.log('Başarısız:', monthlyFailed.join(', '));

// Yearly için aynı işlem
console.log(`\nYearly için ${MISSING_TERRITORIES.length} ülkeye fiyat ekleniyor...\n`);

let yearlySuccess = 0, yearlyFail = 0;
const yearlyFailed = [];

for (let i = 0; i < MISSING_TERRITORIES.length; i++) {
  const territory = MISSING_TERRITORIES[i];
  await refreshTokenIfNeeded();

  const ppId = await getEquivalentPricePoint(YEARLY_SUB_ID, territory, 9.99, token);

  if (!ppId) {
    yearlyFailed.push(territory);
    yearlyFail++;
    continue;
  }

  const addRes = await apiRequest('POST', '/v1/subscriptionPrices', {
    data: {
      type: 'subscriptionPrices',
      attributes: { preserveCurrentPrice: false, startDate: null },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: YEARLY_SUB_ID } },
        subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: ppId } },
      }
    }
  }, token);

  if (addRes.status === 201 || addRes.status === 409) {
    if (i % 20 === 0) process.stdout.write(`  [${i+1}] ${territory} ✓\n`);
    yearlySuccess++;
  } else {
    const errMsg = addRes.body?.errors?.[0]?.detail || `${addRes.status}`;
    console.log(`  [${i+1}] ${territory}: HATA — ${errMsg.slice(0, 100)}`);
    yearlyFailed.push(territory);
    yearlyFail++;
  }

  if (i % 10 === 9) await sleep(1000);
  else await sleep(100);
}

console.log(`\nYearly: ${yearlySuccess} başarılı, ${yearlyFail} başarısız`);

// Son durum
console.log('\n=== FIYAT AYARLAMA TAMAMLANDI ===');
console.log('Şimdi subscriptionSubmissions tekrar dene...');

// Monthly submit
const mSubmit = await apiRequest('POST', `/v1/subscriptionSubmissions`, {
  data: {
    type: 'subscriptionSubmissions',
    relationships: { subscription: { data: { type: 'subscriptions', id: MONTHLY_SUB_ID } } }
  }
}, token);
console.log(`Monthly submit: ${mSubmit.status}`);
if (mSubmit.status >= 400) console.log(mSubmit.body?.errors?.[0]?.detail?.slice(0, 300) || JSON.stringify(mSubmit.body).slice(0, 200));

// Yearly submit
const ySubmit = await apiRequest('POST', `/v1/subscriptionSubmissions`, {
  data: {
    type: 'subscriptionSubmissions',
    relationships: { subscription: { data: { type: 'subscriptions', id: YEARLY_SUB_ID } } }
  }
}, token);
console.log(`Yearly submit: ${ySubmit.status}`);
if (ySubmit.status >= 400) console.log(ySubmit.body?.errors?.[0]?.detail?.slice(0, 300) || JSON.stringify(ySubmit.body).slice(0, 200));
