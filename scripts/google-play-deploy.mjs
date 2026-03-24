#!/usr/bin/env node
/**
 * Google Play Store — Full API Deploy Script
 * Handles: Store Listing, Icon, Feature Graphic, Screenshots, Commit
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Readable } from 'stream';

// ═══════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════
const PACKAGE_NAME = 'com.finansatlas.app';
const SERVICE_ACCOUNT_JSON = '/Users/neslihan/Desktop/Deploy/android deploy/analog-artifact-487900-m1-01c4a4da3e93.json';
const LOGO_PATH = '/Users/neslihan/Desktop/uygulama/Kredy/dist/logo.png';
const SCREENSHOTS_BASE = '/Users/neslihan/Desktop/uygulama/Kredy/screenshots/mockups';
const PRIVACY_URL = 'https://gokhanatar.github.io/Kredy-Finans-Yonetimi/privacy-policy.html';

const LANG_MAP = {
  tr: 'tr-TR',
  en: 'en-US',
  ar: 'ar',
  ru: 'ru-RU',
  uk: 'uk',
};

// ═══════════════════════════════════════════════
// METADATA — 5 Languages
// ═══════════════════════════════════════════════
const METADATA = {
  'tr-TR': {
    title: 'Kredy - Bütçe & Finans',
    shortDescription: 'Kredi kartı, bütçe, yatırım ve aile finansı. AI finans asistanınız.',
    fullDescription: `Kredy ile finanslarınızı tek bir uygulamada yönetin!

💳 Kredi Kartı Yönetimi
• Tüm kredi kartlarınızı takip edin
• Ekstre tarihi ve son ödeme günü hatırlatmaları
• Altın pencere hesaplama ile tasarruf edin
• Taksit planlarınızı görüntüleyin
• Borç çevirme ve yeniden yapılandırma simülatörü

💰 Bütçe & Harcama Takibi
• Gelir ve giderlerinizi kategori bazlı takip edin
• Akıllı bütçe hedefleri belirleyin
• Düzenli ödemelerinizi (fatura, abonelik) yönetin
• Güvenli harcama tutarınızı anlık görün

📊 Yatırım Portföyü (PRO)
• Altın, döviz, hisse, kripto — canlı fiyatlarla
• Portföy dağılımı ve kar/zarar analizi
• BIST ve US hisse takibi

🏠 Varlık Yönetimi (PRO)
• Gayrimenkul, araç takibi
• Emlak vergisi ve MTV hesaplama
• Kira geliri yönetimi

🤖 AI Özellikleri (PRO)
• Akıllı harcama analizi ve anomali tespiti
• Doğal dil ile harcama girişi
• Fiş tarayıcı (kameranızla fiş okutun)
• AI bütçe önerisi
• Findeks kredi skoru simülatörü

👨‍👩‍👧‍👦 Aile Finansı
• Aile grubu oluşturun ve birlikte yönetin
• Gerçek zamanlı senkronizasyon
• Ortak cüzdan ve aktivite bildirimleri

🔒 Güvenlik
• PIN kilidi ve biyometrik doğrulama
• Gizlilik modu (tutarları gizleyin)
• Verileriniz cihazınızda, isteğe bağlı bulut yedekleme

✨ Diğer Özellikler
• 2 mod: Klasik (detaylı) + Basit (sade, animasyonlu)
• 8 tema seçeneği
• 5 dil desteği (TR, EN, AR, RU, UK)
• Ödeme takvimi
• Home screen widget'ları
• Push bildirimler

Ücretsiz sürüm: 2 kart, 2 hesap, 3 fatura, 1 hedef
PRO: Sınırsız erişim + 7 gün ücretsiz deneme`,
  },
  'en-US': {
    title: 'Kredy - Budget & Finance',
    shortDescription: 'Credit card, budget, investment & family finance. AI finance assistant.',
    fullDescription: `Manage all your finances in one app with Kredy!

💳 Credit Card Management
• Track all your credit cards
• Statement date and due date reminders
• Save with golden window calculation
• View installment plans
• Debt transfer and restructuring simulator

💰 Budget & Expense Tracking
• Track income and expenses by category
• Set smart budget goals
• Manage recurring payments (bills, subscriptions)
• See your safe-to-spend amount in real-time

📊 Investment Portfolio (PRO)
• Gold, forex, stocks, crypto — with live prices
• Portfolio distribution and P&L analysis
• BIST and US stock tracking

🏠 Asset Management (PRO)
• Real estate and vehicle tracking
• Property tax and motor vehicle tax calculation
• Rental income management

🤖 AI Features (PRO)
• Smart spending analysis and anomaly detection
• Natural language expense entry
• Receipt scanner (scan receipts with your camera)
• AI budget suggestions
• Credit score simulator

👨‍👩‍👧‍👦 Family Finance
• Create a family group and manage together
• Real-time sync
• Shared wallet and activity notifications

🔒 Security
• PIN lock and biometric authentication
• Privacy mode (hide amounts)
• Data stored on device, optional cloud backup

✨ More Features
• 2 modes: Classic (detailed) + Simple (clean, animated)
• 8 theme options
• 5 language support (TR, EN, AR, RU, UK)
• Payment calendar
• Home screen widgets
• Push notifications

Free version: 2 cards, 2 accounts, 3 bills, 1 goal
PRO: Unlimited access + 7-day free trial`,
  },
  'ar': {
    title: 'Kredy - الميزانية والمالية',
    shortDescription: 'بطاقات الائتمان، الميزانية، الاستثمار والمالية العائلية. مساعدك المالي الذكي.',
    fullDescription: `أدر جميع أموالك في تطبيق واحد مع Kredy!

💳 إدارة بطاقات الائتمان
• تتبع جميع بطاقاتك الائتمانية
• تذكيرات بتاريخ الكشف وتاريخ الاستحقاق
• وفّر مع حساب النافذة الذهبية
• عرض خطط الأقساط
• محاكي تحويل الديون وإعادة الهيكلة

💰 تتبع الميزانية والمصروفات
• تتبع الدخل والمصروفات حسب الفئة
• حدد أهداف ميزانية ذكية
• أدر المدفوعات المتكررة

📊 محفظة الاستثمار (PRO)
• الذهب، العملات، الأسهم، الكريبتو — بأسعار حية
• تحليل توزيع المحفظة والأرباح/الخسائر

🤖 ميزات الذكاء الاصطناعي (PRO)
• تحليل الإنفاق الذكي
• إدخال المصروفات بلغة طبيعية
• ماسح الإيصالات
• اقتراحات ميزانية ذكية

👨‍👩‍👧‍👦 المالية العائلية
• أنشئ مجموعة عائلية وأدر معًا
• مزامنة في الوقت الفعلي

🔒 الأمان
• قفل PIN والمصادقة البيومترية
• وضع الخصوصية
• بيانات مخزنة على جهازك

النسخة المجانية: 2 بطاقات، 2 حسابات، 3 فواتير، هدف واحد
PRO: وصول غير محدود + تجربة مجانية 7 أيام`,
  },
  'ru-RU': {
    title: 'Kredy - Бюджет и финансы',
    shortDescription: 'Кредитные карты, бюджет, инвестиции и семейные финансы. ИИ-помощник.',
    fullDescription: `Управляйте всеми финансами в одном приложении с Kredy!

💳 Управление кредитными картами
• Отслеживайте все кредитные карты
• Напоминания о выписке и сроке оплаты
• Экономьте с расчётом золотого окна
• Просматривайте планы рассрочки
• Симулятор перевода и реструктуризации долга

💰 Бюджет и учёт расходов
• Доходы и расходы по категориям
• Умные бюджетные цели
• Управление регулярными платежами

📊 Инвестиционный портфель (PRO)
• Золото, валюта, акции, крипто — с живыми ценами
• Анализ распределения портфеля и прибыли/убытков

🤖 ИИ-функции (PRO)
• Умный анализ расходов
• Ввод расходов естественным языком
• Сканер чеков
• ИИ-предложения по бюджету

👨‍👩‍👧‍👦 Семейные финансы
• Создайте семейную группу
• Синхронизация в реальном времени

🔒 Безопасность
• PIN-код и биометрия
• Режим конфиденциальности
• Данные на вашем устройстве

Бесплатная версия: 2 карты, 2 счёта, 3 счёта на оплату, 1 цель
PRO: Безлимитный доступ + 7 дней бесплатно`,
  },
  'uk': {
    title: 'Kredy - Бюджет і фінанси',
    shortDescription: 'Кредитні картки, бюджет, інвестиції та сімейні фінанси. ШІ-помічник.',
    fullDescription: `Керуйте всіма фінансами в одному додатку з Kredy!

💳 Управління кредитними картками
• Відстежуйте всі кредитні картки
• Нагадування про виписку та термін оплати
• Заощаджуйте з розрахунком золотого вікна
• Переглядайте плани розстрочки
• Симулятор переведення та реструктуризації боргу

💰 Бюджет і облік витрат
• Доходи та витрати за категоріями
• Розумні бюджетні цілі
• Управління регулярними платежами

📊 Інвестиційний портфель (PRO)
• Золото, валюта, акції, крипто — з живими цінами
• Аналіз розподілу портфеля та прибутку/збитків

🤖 ШІ-функції (PRO)
• Розумний аналіз витрат
• Введення витрат природною мовою
• Сканер чеків
• ШІ-пропозиції щодо бюджету

👨‍👩‍👧‍👦 Сімейні фінанси
• Створіть сімейну групу
• Синхронізація в реальному часі

🔒 Безпека
• PIN-код та біометрія
• Режим конфіденційності
• Дані на вашому пристрої

Безкоштовна версія: 2 картки, 2 рахунки, 3 рахунки на оплату, 1 ціль
PRO: Безлімітний доступ + 7 днів безкоштовно`,
  },
};

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function resizeScreenshotForPlay(inputPath) {
  const meta = await sharp(inputPath).metadata();
  const { width, height } = meta;
  const ratio = height / width;

  if (ratio <= 2.0) {
    return fs.readFileSync(inputPath);
  }

  // Add horizontal padding to achieve 1:2 ratio
  const newWidth = Math.ceil(height / 2);
  const padTotal = newWidth - width;
  const padLeft = Math.floor(padTotal / 2);
  const padRight = padTotal - padLeft;

  return sharp(inputPath)
    .extend({
      top: 0,
      bottom: 0,
      left: padLeft,
      right: padRight,
      background: { r: 26, g: 26, b: 46, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function createFeatureGraphic(logoPath) {
  const logoBuffer = await sharp(logoPath).resize(280, 280).png().toBuffer();

  return sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 255 },
    },
  })
    .composite([{ input: logoBuffer, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function createIcon512(logoPath) {
  return sharp(logoPath).resize(512, 512).png().toBuffer();
}

// ═══════════════════════════════════════════════
// MAIN DEPLOY PIPELINE
// ═══════════════════════════════════════════════
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
  log('EDIT', `Edit created: ${editId}`);

  // ─── STEP 2: Store Listings (5 languages) ───
  log('LISTING', 'Uploading store listings for 5 languages...');
  for (const [lang, meta] of Object.entries(METADATA)) {
    await androidPublisher.edits.listings.update({
      packageName: PACKAGE_NAME,
      editId,
      language: lang,
      requestBody: {
        language: lang,
        title: meta.title,
        shortDescription: meta.shortDescription,
        fullDescription: meta.fullDescription,
      },
    });
    log('LISTING', `  ✅ ${lang}`);
  }

  // ─── STEP 3: App Icon (512x512) ───
  log('ICON', 'Uploading app icon (512x512)...');
  const iconBuffer = await createIcon512(LOGO_PATH);
  await androidPublisher.edits.images.upload({
    packageName: PACKAGE_NAME,
    editId,
    language: 'en-US',
    imageType: 'icon',
    media: { mimeType: 'image/png', body: bufferToStream(iconBuffer) },
  });
  log('ICON', '  ✅ App icon uploaded');

  // ─── STEP 4: Feature Graphic (1024x500) ───
  log('FEATURE', 'Creating and uploading feature graphic...');
  const featureBuffer = await createFeatureGraphic(LOGO_PATH);
  await androidPublisher.edits.images.upload({
    packageName: PACKAGE_NAME,
    editId,
    language: 'en-US',
    imageType: 'featureGraphic',
    media: { mimeType: 'image/png', body: bufferToStream(featureBuffer) },
  });
  log('FEATURE', '  ✅ Feature graphic uploaded');

  // ─── STEP 5: Screenshots (5 languages) ───
  log('SCREENSHOTS', 'Processing and uploading screenshots...');
  for (const [localeLang, playLang] of Object.entries(LANG_MAP)) {
    const screenshotDir = path.join(SCREENSHOTS_BASE, localeLang, 'iphone-6.9');
    if (!fs.existsSync(screenshotDir)) {
      log('SCREENSHOTS', `  ⚠️ Skipping ${playLang} — no directory`);
      continue;
    }

    // Delete existing screenshots first
    try {
      await androidPublisher.edits.images.deleteall({
        packageName: PACKAGE_NAME,
        editId,
        language: playLang,
        imageType: 'phoneScreenshots',
      });
    } catch (e) { /* ignore */ }

    const files = fs.readdirSync(screenshotDir)
      .filter(f => f.endsWith('.png') && !f.startsWith('.'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      })
      .slice(0, 8);

    for (const file of files) {
      const filePath = path.join(screenshotDir, file);
      const resizedBuffer = await resizeScreenshotForPlay(filePath);
      await androidPublisher.edits.images.upload({
        packageName: PACKAGE_NAME,
        editId,
        language: playLang,
        imageType: 'phoneScreenshots',
        media: { mimeType: 'image/png', body: bufferToStream(resizedBuffer) },
      });
      log('SCREENSHOTS', `  ✅ ${playLang}/${file}`);
    }
  }

  // ─── STEP 6: Commit ───
  log('COMMIT', 'Committing edit...');
  await androidPublisher.edits.commit({
    packageName: PACKAGE_NAME,
    editId,
  });

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ STORE LISTING DEPLOYMENT COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log(`Edit ID: ${editId}`);
  console.log(`Languages: ${Object.keys(METADATA).join(', ')}`);
  console.log('Icon: 512x512 ✅');
  console.log('Feature Graphic: 1024x500 ✅');
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ DEPLOY ERROR:', err.message);
  if (err.errors) console.error('Details:', JSON.stringify(err.errors, null, 2));
  if (err.response?.data) console.error('Response:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
