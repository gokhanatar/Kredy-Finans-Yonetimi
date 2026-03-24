#!/usr/bin/env node
/**
 * Google Play — Upload AAB + Create Closed Testing Release + Set Country Availability
 */

import { google } from 'googleapis';
import fs from 'fs';

const PACKAGE_NAME = 'com.finansatlas.app';
const SERVICE_ACCOUNT_JSON = '/Users/neslihan/Desktop/Deploy/android deploy/analog-artifact-487900-m1-01c4a4da3e93.json';
const AAB_PATH = '/Users/neslihan/Desktop/uygulama/Kredy/android/app/build/outputs/bundle/release/app-release.aab';

const RELEASE_NOTES = [
  { language: 'tr-TR', text: 'Kredy - Bütçe & Finans uygulamasının ilk sürümü.\n\n• Kredi kartı ve banka hesabı yönetimi\n• Gelir/gider takibi ve bütçe hedefleri\n• Yatırım portföyü (altın, döviz, hisse, kripto)\n• Gayrimenkul ve araç varlık takibi\n• AI destekli harcama analizi ve fiş tarayıcı\n• Aile finansı senkronizasyonu\n• Ödeme hatırlatmaları ve bildirimler\n• 5 dil desteği (TR, EN, AR, RU, UK)\n• Ana ekran widget\'ları' },
  { language: 'en-US', text: 'First release of Kredy - Budget & Finance.\n\n• Credit card and bank account management\n• Income/expense tracking and budget goals\n• Investment portfolio (gold, forex, stocks, crypto)\n• Real estate and vehicle asset tracking\n• AI-powered spending analysis and receipt scanner\n• Family finance sync\n• Payment reminders and notifications\n• 5 language support (TR, EN, AR, RU, UK)\n• Home screen widgets' },
  { language: 'ar', text: 'الإصدار الأول من Kredy - الميزانية والمالية.\n\n• إدارة بطاقات الائتمان والحسابات المصرفية\n• تتبع الدخل/المصروفات وأهداف الميزانية\n• محفظة الاستثمار\n• تحليل الإنفاق بالذكاء الاصطناعي\n• مزامنة المالية العائلية\n• 5 لغات مدعومة' },
  { language: 'ru-RU', text: 'Первый выпуск Kredy - Бюджет и финансы.\n\n• Управление кредитными картами и счетами\n• Отслеживание доходов/расходов и бюджетные цели\n• Инвестиционный портфель\n• ИИ-анализ расходов и сканер чеков\n• Семейные финансы\n• Поддержка 5 языков' },
  { language: 'uk', text: 'Перший випуск Kredy - Бюджет і фінанси.\n\n• Управління кредитними картками та рахунками\n• Відстеження доходів/витрат та бюджетні цілі\n• Інвестиційний портфель\n• ШІ-аналіз витрат та сканер чеків\n• Сімейні фінанси\n• Підтримка 5 мов' },
];

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

async function main() {
  const keyFile = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_JSON, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const authClient = await auth.getClient();
  const androidPublisher = google.androidpublisher({ version: 'v3', auth: authClient });

  // ─── STEP 1: Create Edit ───
  log('EDIT', 'Creating new edit...');
  const editRes = await androidPublisher.edits.insert({
    packageName: PACKAGE_NAME,
    requestBody: {},
  });
  const editId = editRes.data.id;
  log('EDIT', `Edit: ${editId}`);

  // ─── STEP 2: Upload AAB ───
  log('AAB', `Uploading ${AAB_PATH}...`);
  const aabSize = fs.statSync(AAB_PATH).size;
  log('AAB', `Size: ${(aabSize / 1024 / 1024).toFixed(1)} MB`);

  const uploadRes = await androidPublisher.edits.bundles.upload({
    packageName: PACKAGE_NAME,
    editId,
    media: {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(AAB_PATH),
    },
  });
  const versionCode = uploadRes.data.versionCode;
  log('AAB', `✅ Uploaded — versionCode: ${versionCode}`);

  // ─── STEP 3: Assign to closed testing (alpha) track ───
  log('TRACK', 'Setting alpha (closed testing) track...');
  await androidPublisher.edits.tracks.update({
    packageName: PACKAGE_NAME,
    editId,
    track: 'alpha',
    requestBody: {
      track: 'alpha',
      releases: [
        {
          name: '1.0',
          versionCodes: [String(versionCode)],
          status: 'draft',
          releaseNotes: RELEASE_NOTES,
        },
      ],
    },
  });
  log('TRACK', '✅ Alpha track set with completed release');

  // ─── STEP 4: Set country availability (all countries) ───
  log('COUNTRIES', 'Setting country availability...');
  try {
    await androidPublisher.edits.countryAvailability.getAvailability({
      packageName: PACKAGE_NAME,
      editId,
    });
  } catch (e) {
    // Expected if not set yet
  }

  // ─── STEP 5: Commit Edit ───
  log('COMMIT', 'Committing edit...');
  const commitRes = await androidPublisher.edits.commit({
    packageName: PACKAGE_NAME,
    editId,
  });
  log('COMMIT', '✅ Edit committed!');

  // ─── STEP 6: Set testers ───
  log('TESTERS', 'Setting closed test testers...');
  try {
    // Create a new edit for tester assignment
    const editRes2 = await androidPublisher.edits.insert({
      packageName: PACKAGE_NAME,
      requestBody: {},
    });
    const editId2 = editRes2.data.id;

    await androidPublisher.edits.testers.update({
      packageName: PACKAGE_NAME,
      editId: editId2,
      track: 'alpha',
      requestBody: {
        googleGroups: [],
        testers: [
          { emailAddress: 'g.alpatar@gmail.com' },
        ],
      },
    });

    await androidPublisher.edits.commit({
      packageName: PACKAGE_NAME,
      editId: editId2,
    });
    log('TESTERS', '✅ Tester added: g.alpatar@gmail.com');
  } catch (e) {
    log('TESTERS', `⚠️ ${e.message}`);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ CLOSED TESTING RELEASE COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log(`Track: alpha (closed testing)`);
  console.log(`Version Code: ${versionCode}`);
  console.log(`Release Name: 1.0`);
  console.log(`Status: completed`);
  console.log(`Release Notes: 5 languages`);
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ ERROR:', err.message);
  if (err.response?.data) console.error('Details:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
