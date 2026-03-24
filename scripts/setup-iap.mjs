/**
 * IAP Subscription setup:
 * - Lokalizasyon ekle (5 dil)
 * - Fiyat ayarla
 * - İncelemeye gönder
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
const APP_ID = '6759491761';
const VERSION_ID = '33d8c9a6-81aa-446c-939f-3f9a86a632f8';

// Subscription IDs (from check-iap-status)
const MONTHLY_ID = 'com.finansatlas.app.pro.monthly';
const YEARLY_ID = 'com.finansatlas.app.pro.yearly';

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

// Subscription IDs (resource IDs, not product IDs)
async function getSubscriptionResourceIds(token) {
  // Get subscription group
  const groupRes = await apiRequest('GET', `/v1/apps/${APP_ID}/subscriptionGroups?limit=10`, null, token);
  const group = groupRes.body?.data?.[0];
  if (!group) throw new Error('Subscription group not found');

  const subsRes = await apiRequest('GET', `/v1/subscriptionGroups/${group.id}/subscriptions?limit=10`, null, token);
  const subs = subsRes.body?.data || [];

  const monthly = subs.find(s => s.attributes.productId === MONTHLY_ID);
  const yearly = subs.find(s => s.attributes.productId === YEARLY_ID);

  return { monthlyId: monthly?.id, yearlyId: yearly?.id, groupId: group.id };
}

// Lokalizasyon metinleri
const LOCALIZATIONS = {
  'tr': {
    displayName: 'Kredy Pro',
    description: 'Tüm premium özelliklere sınırsız erişim. Yapay zeka analizi, yatırım portföyü, aile finansı ve daha fazlası.',
  },
  'en-US': {
    displayName: 'Kredy Pro',
    description: 'Unlimited access to all premium features. AI analysis, investment portfolio, family finance, and more.',
  },
  'ar-SA': {
    displayName: 'Kredy Pro',
    description: 'وصول غير محدود لجميع الميزات المتميزة. تحليل الذكاء الاصطناعي، محفظة الاستثمار، المالية العائلية والمزيد.',
  },
  'ru': {
    displayName: 'Kredy Pro',
    description: 'Неограниченный доступ ко всем премиум-функциям. ИИ-анализ, инвестиционный портфель, семейные финансы и многое другое.',
  },
  'uk': {
    displayName: 'Kredy Pro',
    description: 'Необмежений доступ до всіх преміум-функцій. ІІ-аналіз, інвестиційний портфель, сімейні фінанси та багато іншого.',
  },
};

async function addLocalization(subscriptionId, locale, displayName, description, token) {
  // Check existing localizations first
  const existingRes = await apiRequest('GET', `/v1/subscriptions/${subscriptionId}/subscriptionLocalizations?limit=20`, null, token);
  if (existingRes.body?.data) {
    const existing = existingRes.body.data.find(l => l.attributes.locale === locale);
    if (existing) {
      // Update existing
      const updateRes = await apiRequest('PATCH', `/v1/subscriptionLocalizations/${existing.id}`, {
        data: {
          type: 'subscriptionLocalizations',
          id: existing.id,
          attributes: { name: displayName, description },
        }
      }, token);
      return updateRes.status < 300 ? 'updated' : `error ${updateRes.status}`;
    }
  }

  // Create new
  const res = await apiRequest('POST', '/v1/subscriptionLocalizations', {
    data: {
      type: 'subscriptionLocalizations',
      attributes: { locale, name: displayName, description },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: subscriptionId } }
      }
    }
  }, token);

  return res.status === 201 ? 'created' : `error ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`;
}

async function setPricing(subscriptionId, token) {
  // Get existing prices
  const existRes = await apiRequest('GET', `/v1/subscriptions/${subscriptionId}/prices?limit=5`, null, token);
  console.log(`    Mevcut fiyat: ${existRes.status} | ${existRes.body?.data?.length || 0} kayıt`);

  if (existRes.body?.data?.length > 0) {
    console.log(`    Fiyat zaten ayarlanmış, atlanıyor`);
    return;
  }

  // Set price - USD $1.99/month tier
  // Tier 1 = $0.99, Tier 2 = $1.99, ...
  // Use baseTerritory: USA, customerPrice: 1.99
  const priceRes = await apiRequest('POST', `/v1/subscriptions/${subscriptionId}/prices`, {
    data: {
      type: 'subscriptionPrices',
      attributes: {
        preserveCurrentPrice: false,
        startDate: null,
      },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: subscriptionId } },
        subscriptionPricePoint: {
          data: {
            type: 'subscriptionPricePoints',
            id: 'SUBSCRIPTION_PRICE_POINT_ID', // placeholder - need actual point ID
          }
        }
      }
    }
  }, token);
  console.log(`    Fiyat ayarı: ${priceRes.status}`);
}

async function getMonthlyPricePointId(subscriptionId, token) {
  // Get available price points for USD
  const res = await apiRequest('GET',
    `/v1/subscriptions/${subscriptionId}/pricePoints?filter[territory]=USA&limit=100`,
    null, token);

  if (res.body?.data) {
    // Find $1.99 tier
    const point = res.body.data.find(p =>
      p.attributes?.customerPrice === '1.99' ||
      p.attributes?.proceeds === '1.40'  // ~70% of 1.99
    );
    return point?.id;
  }
  return null;
}

async function setSubscriptionPrice(subscriptionId, pricePointId, token) {
  const res = await apiRequest('POST', `/v1/subscriptionPrices`, {
    data: {
      type: 'subscriptionPrices',
      attributes: { preserveCurrentPrice: false },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: subscriptionId } },
        subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: pricePointId } },
      }
    }
  }, token);
  return res.status;
}

async function main() {
  console.log('=== IAP Setup Başlıyor ===\n');

  const token = getToken();

  // 1. Subscription resource ID'lerini al
  const { monthlyId, yearlyId, groupId } = await getSubscriptionResourceIds(token);
  console.log(`Monthly ID: ${monthlyId}`);
  console.log(`Yearly ID:  ${yearlyId}`);
  console.log(`Group ID:   ${groupId}\n`);

  if (!monthlyId || !yearlyId) {
    console.error('Subscription ID bulunamadı!');
    process.exit(1);
  }

  // 2. Lokalizasyon ekle — Monthly
  console.log('-- Monthly lokalizasyonlar --');
  for (const [locale, texts] of Object.entries(LOCALIZATIONS)) {
    const result = await addLocalization(monthlyId, locale, texts.displayName + ' Aylık', texts.description, token);
    console.log(`  ${locale}: ${result}`);
    await sleep(300);
  }

  // 3. Lokalizasyon ekle — Yearly
  console.log('\n-- Yearly lokalizasyonlar --');
  for (const [locale, texts] of Object.entries(LOCALIZATIONS)) {
    const result = await addLocalization(yearlyId, locale, texts.displayName + ' Yıllık', texts.description, token);
    console.log(`  ${locale}: ${result}`);
    await sleep(300);
  }

  // 4. Fiyat noktalarını kontrol et
  console.log('\n-- Monthly fiyat noktaları (ilk 5 USD) --');
  const monthlyPPRes = await apiRequest('GET',
    `/v1/subscriptions/${monthlyId}/pricePoints?filter[territory]=USA&limit=10`,
    null, token);

  if (monthlyPPRes.body?.data?.length > 0) {
    monthlyPPRes.body.data.slice(0, 5).forEach(pp => {
      console.log(`  ${pp.id}: $${pp.attributes?.customerPrice} (proceeds: $${pp.attributes?.proceeds})`);
    });
  } else {
    console.log('  Fiyat noktası bulunamadı:', JSON.stringify(monthlyPPRes.body).slice(0, 300));
  }

  // 5. Mevcut fiyat durumu
  console.log('\n-- Mevcut subscription fiyatları --');
  const monthlyPricesRes = await apiRequest('GET', `/v1/subscriptions/${monthlyId}/prices?limit=5`, null, token);
  console.log(`  Monthly fiyatlar: ${monthlyPricesRes.body?.data?.length || 0} kayıt`);

  const yearlyPricesRes = await apiRequest('GET', `/v1/subscriptions/${yearlyId}/prices?limit=5`, null, token);
  console.log(`  Yearly fiyatlar: ${yearlyPricesRes.body?.data?.length || 0} kayıt`);

  // 6. Version review notes'u güncelle (PassKit açıklaması)
  console.log('\n-- Version review notes güncelleniyor --');
  const reviewNotesRes = await apiRequest('PATCH', `/v1/appStoreVersions/${VERSION_ID}`, {
    data: {
      type: 'appStoreVersions',
      id: VERSION_ID,
      attributes: {
        reviewNotes: `PassKit Framework Usage Note:

This app does not implement Apple Pay or any payment processing functionality. PassKit is not intentionally imported by our code.

PassKit appears as a linked framework because Capacitor (our cross-platform framework) or one of its plugins automatically links it during the build process. This is a known behavior with Capacitor iOS builds.

Our app uses:
- StoreKit 2 for in-app purchases (Pro subscription)
- No wallet, boarding pass, loyalty card, or payment card features

If PassKit causes concern, we can add a Privacy Manifest entry clarifying no PassKit APIs are called at runtime. Please let us know how to proceed.

Test Account:
Email: test@kredy.app
Password: KredyTest2024!

The app works fully without login - users can explore all features using local storage.`,
      }
    }
  }, token);
  console.log(`  Review notes: ${reviewNotesRes.status}`);

  console.log('\n=== SONUÇ ===');
  console.log('Lokalizasyonlar eklendi.');
  console.log('Fiyat ayarlamak için App Store Connect UI kullanın:');
  console.log('  Monthly: $1.99/ay');
  console.log('  Yearly: $9.99/yıl (₺399.99)');
  console.log('\nFiyat ayarlandıktan sonra "Submit for Review" butonuna basın.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
