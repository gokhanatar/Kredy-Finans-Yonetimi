#!/usr/bin/env node
/**
 * Kredy — App Store Connect Screenshot Upload
 * Fastlane deliver ile 5 dil × 3 cihaz × 10 screenshot yükleme
 *
 * Sıralama: pos1, pos2, pos4, pos3, pos5, pos6, pos7, pos8, pos9, pos10
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = '/Users/neslihan/Desktop/uygulama/Kredy';
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots/mockups');
const DELIVER_DIR = path.join(ROOT, 'fastlane_screenshots');

// App Store Connect dil kodları
// https://developer.apple.com/help/app-store-connect/reference/app-store-localizations/
const LANG_MAP = {
  tr: 'tr',      // Türkçe
  en: 'en-US',   // İngilizce (ABD)
  ar: 'ar-SA',   // Arapça (Suudi Arabistan)
  ru: 'ru',      // Rusça
  uk: 'uk',      // Ukraynaca
};

// Fastlane deliver screenshot klasör isimleri (cihaz boyutuna göre)
const DEVICE_FOLDERS = {
  'iphone-6.9': 'APP_IPHONE_67',        // 6.9" (1290x2796) → Display Type 67
  'ipad-13':    'APP_IPAD_PRO_6GEN_13', // iPad 13" (2064x2752)
  'mac':        'APP_DESKTOP',           // Mac (2880x1800)
};

// Screenshot sıralaması: pos1, pos2, pos4 ilk 3; sonra geri kalanı
const POSITION_ORDER = [1, 2, 4, 3, 5, 6, 7, 8, 9, 10];

function setupDeliverStructure() {
  // Eski yapıyı temizle
  if (fs.existsSync(DELIVER_DIR)) {
    fs.rmSync(DELIVER_DIR, { recursive: true });
  }

  for (const [langCode, ascLang] of Object.entries(LANG_MAP)) {
    for (const [device, folder] of Object.entries(DEVICE_FOLDERS)) {
      const dir = path.join(DELIVER_DIR, ascLang, folder);
      fs.mkdirSync(dir, { recursive: true });

      // Screenshot'ları sıralı olarak kopyala
      POSITION_ORDER.forEach((pos, index) => {
        const src = path.join(SCREENSHOTS_DIR, langCode, device, `pos${pos}.png`);
        if (fs.existsSync(src)) {
          // Fastlane sıralama: dosya adı alfabetik sıraya göre
          const seqNum = String(index + 1).padStart(2, '0');
          const dst = path.join(dir, `${seqNum}_pos${pos}.png`);
          fs.copyFileSync(src, dst);
        } else {
          console.error(`EKSIK: ${src}`);
        }
      });
    }
  }

  console.log('Deliver klasör yapısı oluşturuldu.');
}

function verifyStructure() {
  let total = 0;
  let missing = 0;

  for (const [langCode, ascLang] of Object.entries(LANG_MAP)) {
    for (const [device, folder] of Object.entries(DEVICE_FOLDERS)) {
      const dir = path.join(DELIVER_DIR, ascLang, folder);
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.png')) : [];
      total += files.length;
      if (files.length !== 10) {
        console.error(`UYARI: ${ascLang}/${folder} → ${files.length}/10 dosya`);
        missing += (10 - files.length);
      }
    }
  }

  console.log(`Toplam: ${total} dosya (${missing} eksik)`);
  return missing === 0;
}

function uploadScreenshots() {
  const API_KEY_ID = '3Y4L9XJC76';
  const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';
  const KEY_PATH = path.join(process.env.HOME, '.appstoreconnect/private_keys/AuthKey_3Y4L9XJC76.p8');
  const APP_ID = 'com.finansatlas.app';

  // Fastlane deliver komutu
  const cmd = [
    'fastlane deliver',
    `--app_identifier "${APP_ID}"`,
    `--screenshots_path "${DELIVER_DIR}"`,
    `--api_key_path "${path.join(ROOT, 'fastlane_api_key.json')}"`,
    '--overwrite_screenshots',
    '--skip_binary_upload',
    '--skip_metadata',
    '--skip_app_version_update',
    '--force',
    '--precheck_include_in_app_purchases false',
  ].join(' ');

  // API key JSON oluştur — fastlane 2.232+ requires 'key' field with actual key content
  const keyContent = fs.readFileSync(KEY_PATH, 'utf-8');
  const apiKeyJson = {
    key_id: API_KEY_ID,
    issuer_id: ISSUER_ID,
    key: keyContent,
    in_house: false,
  };
  fs.writeFileSync(path.join(ROOT, 'fastlane_api_key.json'), JSON.stringify(apiKeyJson, null, 2));

  console.log('\n=== Fastlane Deliver ile Upload Başlıyor ===');
  console.log(`Komut: ${cmd}\n`);

  try {
    execSync(cmd, {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 600000, // 10 dakika
      env: { ...process.env, FASTLANE_DISABLE_COLORS: '1' },
    });
    console.log('\n✅ Upload tamamlandı!');
  } catch (err) {
    console.error('\n❌ Upload hatası:', err.message);
    process.exit(1);
  } finally {
    // API key temizle
    try { fs.unlinkSync(path.join(ROOT, 'fastlane_api_key.json')); } catch {}
  }
}

// ─── MAIN ───
console.log('=== Kredy Screenshot Upload Pipeline ===\n');

console.log('1. Deliver klasör yapısı oluşturuluyor...');
setupDeliverStructure();

console.log('\n2. Doğrulama...');
const ok = verifyStructure();
if (!ok) {
  console.error('Eksik dosyalar var! İptal.');
  process.exit(1);
}

// Sıralama kontrolü
console.log('\nSıralama (her dil/cihaz için):');
POSITION_ORDER.forEach((pos, i) => {
  const labels = {
    1: 'Anasayfa', 2: 'Altın Pencere Takvimi', 3: 'Analitik',
    4: 'Yatırım Portföyü', 5: 'Emlak & Araçlar', 6: 'Takla Simülatörü',
    7: 'Kartlar', 8: 'Bildirimler', 9: 'Aile Finansı', 10: 'Basit Mod',
  };
  console.log(`  ${i + 1}. ${labels[pos]} (pos${pos})`);
});

console.log('\n3. Upload başlıyor...');
uploadScreenshots();

// Temizlik
console.log('\n4. Geçici dosyaları temizliyorum...');
if (fs.existsSync(DELIVER_DIR)) {
  fs.rmSync(DELIVER_DIR, { recursive: true });
  console.log('fastlane_screenshots temizlendi.');
}

console.log('\n=== Bitti! ===');
