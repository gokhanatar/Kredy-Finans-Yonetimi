#!/usr/bin/env node
/**
 * Google Play — Subscription Creation via Monetization API
 */

import { google } from 'googleapis';
import fs from 'fs';

const PACKAGE_NAME = 'com.finansatlas.app';
const SERVICE_ACCOUNT_JSON = '/Users/neslihan/Desktop/Deploy/android deploy/analog-artifact-487900-m1-01c4a4da3e93.json';

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

async function getAuthClient() {
  const keyFile = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_JSON, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  return auth.getClient();
}

async function main() {
  const authClient = await getAuthClient();
  const androidPublisher = google.androidpublisher({ version: 'v3', auth: authClient });

  // Check existing
  log('CHECK', 'Listing existing subscriptions...');
  let existingSubs = [];
  try {
    const listRes = await androidPublisher.monetization.subscriptions.list({
      packageName: PACKAGE_NAME,
    });
    existingSubs = listRes.data.subscriptions || [];
    for (const sub of existingSubs) log('CHECK', `  Existing: ${sub.productId}`);
  } catch (e) {
    log('CHECK', `None found`);
  }

  const subscriptions = [
    {
      productId: 'com.finansatlas.app.pro.monthly',
      listings: [
        { languageCode: 'tr-TR', title: 'Kredy PRO Aylık', description: 'Sınırsız erişim, AI özellikleri, yatırım portföyü, aile finansı.' },
        { languageCode: 'en-US', title: 'Kredy PRO Monthly', description: 'Unlimited access, AI features, investment portfolio, family finance.' },
        { languageCode: 'ar', title: 'Kredy PRO شهري', description: 'وصول غير محدود، ميزات الذكاء الاصطناعي، محفظة الاستثمار.' },
        { languageCode: 'ru-RU', title: 'Kredy PRO Ежемесячно', description: 'Безлимитный доступ, ИИ-функции, инвестиционный портфель.' },
        { languageCode: 'uk', title: 'Kredy PRO Щомісяця', description: 'Безлімітний доступ, ШІ-функції, інвестиційний портфель.' },
      ],
      basePlan: {
        basePlanId: 'monthly-base',
        billingPeriod: 'P1M',
        gracePeriod: 'P3D',
        trPrice: { currencyCode: 'TRY', units: '39', nanos: 990000000 },
        usdPrice: { currencyCode: 'USD', units: '1', nanos: 990000000 },
        eurPrice: { currencyCode: 'EUR', units: '1', nanos: 990000000 },
      },
    },
    {
      productId: 'com.finansatlas.app.pro.yearly',
      listings: [
        { languageCode: 'tr-TR', title: 'Kredy PRO Yıllık', description: 'Sınırsız erişim, tüm PRO özellikler. Aylık plana göre %17 tasarruf!' },
        { languageCode: 'en-US', title: 'Kredy PRO Yearly', description: 'Unlimited access, all PRO features. Save 17% compared to monthly!' },
        { languageCode: 'ar', title: 'Kredy PRO سنوي', description: 'وصول غير محدود، جميع ميزات PRO. وفّر 17%!' },
        { languageCode: 'ru-RU', title: 'Kredy PRO Годовой', description: 'Безлимитный доступ, все PRO функции. Экономия 17%!' },
        { languageCode: 'uk', title: 'Kredy PRO Річний', description: 'Безлімітний доступ, всі PRO функції. Заощаджуйте 17%!' },
      ],
      basePlan: {
        basePlanId: 'yearly-base',
        billingPeriod: 'P1Y',
        gracePeriod: 'P7D',
        trPrice: { currencyCode: 'TRY', units: '399', nanos: 990000000 },
        usdPrice: { currencyCode: 'USD', units: '19', nanos: 990000000 },
        eurPrice: { currencyCode: 'EUR', units: '19', nanos: 990000000 },
      },
    },
  ];

  for (const sub of subscriptions) {
    if (existingSubs.find(s => s.productId === sub.productId)) {
      log('SUB', `${sub.productId} already exists, skipping`);
      continue;
    }

    log('SUB', `Creating ${sub.productId}...`);
    try {
      await androidPublisher.monetization.subscriptions.create({
        packageName: PACKAGE_NAME,
        productId: sub.productId,
        'regionsVersion.version': '2022/02',
        requestBody: {
          productId: sub.productId,
          listings: sub.listings,
          basePlans: [
            {
              basePlanId: sub.basePlan.basePlanId,
              autoRenewingBasePlanType: {
                billingPeriodDuration: sub.basePlan.billingPeriod,
                gracePeriodDuration: sub.basePlan.gracePeriod,
                resubscribeState: 'RESUBSCRIBE_STATE_ACTIVE',
                accountHoldDuration: 'P30D',
              },
              state: 'ACTIVE',
              offerTags: [{ tag: sub.basePlan.basePlanId.replace('-base', '') }],
              regionalConfigs: [
                {
                  regionCode: 'TR',
                  newSubscriberAvailability: true,
                  price: sub.basePlan.trPrice,
                },
              ],
              otherRegionsConfig: {
                usdPrice: sub.basePlan.usdPrice,
                eurPrice: sub.basePlan.eurPrice,
                newSubscriberAvailability: true,
              },
            },
          ],
        },
      });
      log('SUB', `✅ ${sub.productId} created`);
    } catch (e) {
      log('SUB', `❌ ${sub.productId}: ${e.message}`);
      if (e.response?.data?.error) {
        log('SUB', JSON.stringify(e.response.data.error, null, 2));
      }
    }
  }

  // ─── FREE TRIAL OFFERS ───
  log('OFFERS', 'Creating 7-day free trial offers...');
  for (const sub of subscriptions) {
    const basePlanId = sub.basePlan.basePlanId;
    const trialOfferId = `${basePlanId}-trial`;

    try {
      // Check existing offers
      let existingOffers = [];
      try {
        const offersRes = await androidPublisher.monetization.subscriptions.basePlans.offers.list({
          packageName: PACKAGE_NAME,
          productId: sub.productId,
          basePlanId: basePlanId,
        });
        existingOffers = offersRes.data.subscriptionOffers || [];
      } catch (e) { /* none */ }

      if (existingOffers.find(o => o.offerId === trialOfferId)) {
        log('OFFERS', `  ${sub.productId} trial already exists`);
        continue;
      }

      await androidPublisher.monetization.subscriptions.basePlans.offers.create({
        packageName: PACKAGE_NAME,
        productId: sub.productId,
        basePlanId: basePlanId,
        offerId: trialOfferId,
        'regionsVersion.version': '2022/02',
        requestBody: {
          offerId: trialOfferId,
          phases: [
            {
              recurrenceCount: 1,
              duration: 'P1W',
              regionalConfigs: [
                { regionCode: 'TR', free: {} },
              ],
              otherRegionsConfig: {
                free: {},
              },
            },
          ],
          offerTags: [{ tag: 'free-trial' }],
          targeting: {
            acquisitionRule: {
              scope: {
                thisSubscription: {},
              },
            },
          },
          state: 'ACTIVE',
        },
      });
      log('OFFERS', `  ✅ 7-day trial for ${sub.productId}`);
    } catch (e) {
      log('OFFERS', `  ❌ ${sub.productId}: ${e.message}`);
      if (e.response?.data?.error) {
        log('OFFERS', `  ${JSON.stringify(e.response.data.error.message)}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ SUBSCRIPTION SETUP COMPLETE');
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ ERROR:', err.message);
  process.exit(1);
});
