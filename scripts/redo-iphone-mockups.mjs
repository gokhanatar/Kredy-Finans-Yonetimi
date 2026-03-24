#!/usr/bin/env node
/**
 * Redo iPhone 6.9" Mockups — realistic iPhone 16 Pro Max device template
 * Ultra-thin bezel, proper Dynamic Island, Natural Titanium frame
 * Sıralama AYNI kalır: pos1..pos10
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = '/Users/neslihan/Desktop/uygulama/Kredy';
const MOCKUPS_DIR = path.join(ROOT, 'screenshots/mockups');
const BACKUP_DIR = path.join(ROOT, 'screenshots/mockups_backup_iphone');

const mockW = 1290;
const mockH = 2796;
const DEVICE = 'iphone-6.9';
const LANGS = ['tr', 'en', 'ar', 'ru', 'uk'];

// ─── Extract SCREEN CONTENT from BACKUP ───
// Backup'taki eski mockup 0.70 ratio phone frame içeriyordu (bezel ~13px, cornerR ~55)
// Eski bezeli atlayıp sadece saf ekran içeriğini çıkartıyoruz
const OLD_PHONE_W = Math.round(mockW * 0.70);   // 903
const OLD_PHONE_H = Math.round(mockH * 0.70);   // 1957
const OLD_PHONE_X = Math.round((mockW - OLD_PHONE_W) / 2); // 194
const OLD_PHONE_Y = mockH - OLD_PHONE_H - Math.round(mockH * 0.03); // 755
const OLD_BEZEL = 16; // eski bezel + biraz margin
const SRC_X = OLD_PHONE_X + OLD_BEZEL;
const SRC_Y = OLD_PHONE_Y + OLD_BEZEL;
const SRC_W = OLD_PHONE_W - OLD_BEZEL * 2;  // 871
const SRC_H = OLD_PHONE_H - OLD_BEZEL * 2;  // 1925

// ─── NEW layout — iPhone 16 Pro Max realistic proportions ───
// Gerçek iPhone 16 PM: 77.6mm genişlik, ~5.5mm köşe radius = %7.1 oran
// Önden bakınca SADECE EKRAN görünmeli, çerçeve yok gibi
const phoneW = Math.round(mockW * 0.82);  // 1058 — büyük telefon
const phoneH = Math.round(mockH * 0.82);  // 2293
const phoneX = Math.round((mockW - phoneW) / 2); // 116
const phoneY = mockH - phoneH - Math.round(mockH * 0.012); // 470

// Gerçek iPhone köşe yuvarlaklığı: display ~%7.1, frame biraz daha fazla
const cornerR = 75;   // gerçek iPhone gibi belirgin yuvarlak köşe
const bezelW = 3;     // 3px — önden neredeyse yok
const frameW = phoneW + bezelW * 2;  // 980
const frameH = phoneH + bezelW * 2;  // 2109
const frameX = phoneX - bezelW;      // 155
const frameY = phoneY - bezelW;      // 637
const frameR = cornerR + bezelW;     // 68

// Dynamic Island — proportional to real device
const diW = Math.round(phoneW * 0.25);
const diH = Math.round(phoneW * 0.07);
const diX = phoneX + Math.round((phoneW - diW) / 2);
const diY = phoneY + Math.round(phoneH * 0.008);
const diR = Math.round(diH / 2);

// Home indicator
const hiW = Math.round(phoneW * 0.34);
const hiH = 5;
const hiX = phoneX + Math.round((phoneW - hiW) / 2);
const hiY = phoneY + phoneH - Math.round(phoneH * 0.013) - hiH;
const hiR = Math.round(hiH / 2);

// Side buttons — neredeyse görünmez
const btnW = 3;
const powerH = Math.round(phoneH * 0.06);
const powerY = phoneY + Math.round(phoneH * 0.18);
const volUpH = Math.round(phoneH * 0.04);
const volDownH = Math.round(phoneH * 0.04);
const volUpY = phoneY + Math.round(phoneH * 0.14);
const volDownY = volUpY + volUpH + Math.round(phoneH * 0.012);
const actionY = volUpY - Math.round(phoneH * 0.033);
const actionH = Math.round(phoneH * 0.015);

// ─── Headlines (SIRAYLA AYNI) ───
const HEADLINES = {
  tr: {
    1: { title: 'Finanslarını\nTek Yerden Yönet', sub: 'Gelir, gider, kart ve yatırım takibi' },
    2: { title: 'Altın Pencere\nTakvimi', sub: 'En uygun harcama zamanını bul' },
    3: { title: 'Detaylı Analitik\nGörünüm', sub: 'Harcamalarını grafiklerle takip et' },
    4: { title: 'Yatırım Portföyü', sub: 'Altın, döviz, hisse ve kripto' },
    5: { title: 'Emlak & Araçlar', sub: 'Varlıklarını ve vergilerini takip et' },
    6: { title: 'Takla Simülatörü', sub: 'Borç çevirme hesaplayıcısı' },
    7: { title: 'Akıllı Kart\nYönetimi', sub: 'Ticari ve bireysel kartlar' },
    8: { title: 'Bildirimler', sub: 'Vade ve ödeme hatırlatmaları' },
    9: { title: 'Aile Finansı', sub: 'Ortak bütçe ve paylaşım' },
    10: { title: 'Basit Mod', sub: 'Sade ve hızlı finans takibi' },
  },
  en: {
    1: { title: 'Manage Your\nFinances', sub: 'Income, expenses, cards & investments' },
    2: { title: 'Golden Window\nCalendar', sub: 'Find the best time to spend' },
    3: { title: 'Detailed Analytics', sub: 'Track spending with charts' },
    4: { title: 'Investment\nPortfolio', sub: 'Gold, forex, stocks & crypto' },
    5: { title: 'Real Estate\n& Vehicles', sub: 'Track assets and taxes' },
    6: { title: 'Debt Rolling\nSimulator', sub: 'Balance transfer calculator' },
    7: { title: 'Smart Card\nManagement', sub: 'Commercial & personal cards' },
    8: { title: 'Notifications', sub: 'Due date & payment reminders' },
    9: { title: 'Family Finance', sub: 'Shared budget & sync' },
    10: { title: 'Simple Mode', sub: 'Clean & fast finance tracking' },
  },
  ar: {
    1: { title: 'إدارة أموالك\nمن مكان واحد', sub: 'الدخل والمصروفات والبطاقات والاستثمارات' },
    2: { title: 'تقويم النافذة\nالذهبية', sub: 'اعثر على أفضل وقت للإنفاق' },
    3: { title: 'تحليلات مفصلة', sub: 'تتبع الإنفاق بالرسوم البيانية' },
    4: { title: 'محفظة\nالاستثمار', sub: 'ذهب وعملات وأسهم وعملات رقمية' },
    5: { title: 'العقارات\nوالمركبات', sub: 'تتبع الأصول والضرائب' },
    6: { title: 'محاكي تحويل\nالديون', sub: 'حاسبة تحويل الرصيد' },
    7: { title: 'إدارة البطاقات\nالذكية', sub: 'بطاقات تجارية وشخصية' },
    8: { title: 'الإشعارات', sub: 'تذكيرات الاستحقاق والدفع' },
    9: { title: 'المالية\nالعائلية', sub: 'ميزانية مشتركة ومزامنة' },
    10: { title: 'الوضع البسيط', sub: 'تتبع مالي سريع وبسيط' },
  },
  ru: {
    1: { title: 'Управляйте\nФинансами', sub: 'Доходы, расходы, карты и инвестиции' },
    2: { title: 'Календарь\nЗолотого Окна', sub: 'Лучшее время для покупок' },
    3: { title: 'Подробная\nАналитика', sub: 'Отслеживайте расходы с графиками' },
    4: { title: 'Инвестиционный\nПортфель', sub: 'Золото, валюта, акции и крипто' },
    5: { title: 'Недвижимость\nи Транспорт', sub: 'Учёт активов и налогов' },
    6: { title: 'Симулятор\nПереброски Долга', sub: 'Калькулятор переноса баланса' },
    7: { title: 'Умное Управление\nКартами', sub: 'Коммерческие и личные карты' },
    8: { title: 'Уведомления', sub: 'Напоминания о сроках и платежах' },
    9: { title: 'Семейные\nФинансы', sub: 'Общий бюджет и синхронизация' },
    10: { title: 'Простой Режим', sub: 'Быстрый финансовый учёт' },
  },
  uk: {
    1: { title: 'Керуйте\nФінансами', sub: 'Доходи, витрати, картки та інвестиції' },
    2: { title: 'Календар\nЗолотого Вікна', sub: 'Знайдіть найкращий час для покупок' },
    3: { title: 'Детальна\nАналітика', sub: 'Відстежуйте витрати з графіками' },
    4: { title: 'Інвестиційний\nПортфель', sub: 'Золото, валюта, акції та крипто' },
    5: { title: 'Нерухомість\nта Транспорт', sub: 'Облік активів та податків' },
    6: { title: 'Симулятор\nПерекидання Боргу', sub: 'Калькулятор переносу балансу' },
    7: { title: 'Розумне Керування\nКартками', sub: 'Комерційні та особисті картки' },
    8: { title: 'Сповіщення', sub: 'Нагадування про терміни та платежі' },
    9: { title: 'Сімейні\nФінанси', sub: 'Спільний бюджет та синхронізація' },
    10: { title: 'Простий Режим', sub: 'Швидкий фінансовий облік' },
  },
};

const GRADIENTS = {
  1: ['#0077B6', '#00B4D8', '#90E0EF'],
  2: ['#FFD700', '#FFA500', '#FF8C00'],
  3: ['#1B1B3A', '#2E2E5E', '#4A4E8C'],
  4: ['#7B68EE', '#9B8FFF', '#C4B5FD'],
  5: ['#2D6A4F', '#40916C', '#95D5B2'],
  6: ['#DC2626', '#F97316', '#FCD34D'],
  7: ['#0EA5E9', '#38BDF8', '#7DD3FC'],
  8: ['#F59E0B', '#FBBF24', '#FDE68A'],
  9: ['#EC4899', '#F472B6', '#FBCFE8'],
  10: ['#6366F1', '#818CF8', '#C7D2FE'],
};

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createFrameSVG(pos, lang) {
  const hl = (HEADLINES[lang] || HEADLINES.tr)[pos];
  const grad = GRADIENTS[pos];

  const titleLines = hl.title.split('\n');
  const maxLen = Math.max(...titleLines.map(l => l.length));
  const titleSize = maxLen > 18 ? 52 : maxLen > 14 ? 60 : 72;
  const subLen = hl.sub.length;
  const subSize = subLen > 40 ? 26 : subLen > 30 ? 30 : 34;
  const titleY = Math.round(mockH * 0.03);
  const font = "'SF Pro Display', 'SF Pro', system-ui, -apple-system, sans-serif";

  const titleSVG = titleLines.map((l, i) =>
    `<text x="${mockW / 2}" y="${titleY + (i + 1) * (titleSize * 1.18)}" text-anchor="middle" font-family="${font}" font-size="${titleSize}" font-weight="800" fill="white" letter-spacing="-0.02em">${esc(l)}</text>`
  ).join('\n    ');
  const subY = titleY + titleLines.length * (titleSize * 1.18) + subSize * 1.3;

  // Natural Titanium — barely visible from front
  const fDark = '#1A1A1C';
  const fMid = '#2C2C2E';
  const fEdge = '#48484A';

  return `<svg width="${mockW}" height="${mockH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${grad[0]}"/>
        <stop offset="50%" stop-color="${grad[1]}"/>
        <stop offset="100%" stop-color="${grad[2]}"/>
      </linearGradient>
      <linearGradient id="ti" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${fEdge}"/>
        <stop offset="40%" stop-color="${fMid}"/>
        <stop offset="60%" stop-color="${fDark}"/>
        <stop offset="100%" stop-color="${fEdge}"/>
      </linearGradient>
      <linearGradient id="btn" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${fMid}"/>
        <stop offset="50%" stop-color="${fEdge}"/>
        <stop offset="100%" stop-color="${fMid}"/>
      </linearGradient>
      <filter id="sh">
        <feDropShadow dx="0" dy="18" stdDeviation="38" flood-color="rgba(0,0,0,0.55)"/>
      </filter>
    </defs>

    <rect width="${mockW}" height="${mockH}" fill="url(#bg)"/>

    ${titleSVG}
    <text x="${mockW / 2}" y="${subY}" text-anchor="middle" font-family="${font}" font-size="${subSize}" font-weight="600" fill="rgba(255,255,255,0.85)">${esc(hl.sub)}</text>

    <!-- Shadow -->
    <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="${frameR}" fill="black" filter="url(#sh)" opacity="0.5"/>

    <!-- Titanium chassis — ultra-thin from front view -->
    <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="${frameR}" fill="${fDark}"/>
    <rect x="${frameX + 1}" y="${frameY + 1}" width="${frameW - 2}" height="${frameH - 2}" rx="${frameR - 1}" fill="url(#ti)"/>

    <!-- Subtle top shine -->
    <rect x="${frameX + 40}" y="${frameY}" width="${frameW - 80}" height="1" rx="0.5" fill="rgba(255,255,255,0.08)"/>

    <!-- Screen -->
    <rect x="${phoneX}" y="${phoneY}" width="${phoneW}" height="${phoneH}" rx="${cornerR}" fill="#000"/>

    <!-- Dynamic Island -->
    <rect x="${diX}" y="${diY}" width="${diW}" height="${diH}" rx="${diR}" fill="#000"/>
    <circle cx="${diX + diW - Math.round(diH * 0.5)}" cy="${diY + Math.round(diH / 2)}" r="${Math.round(diH * 0.16)}" fill="#111118"/>
    <circle cx="${diX + diW - Math.round(diH * 0.5)}" cy="${diY + Math.round(diH / 2)}" r="${Math.round(diH * 0.06)}" fill="#08080E"/>

    <!-- Power (right) -->
    <rect x="${frameX + frameW}" y="${powerY}" width="${btnW}" height="${powerH}" rx="2" fill="url(#btn)"/>

    <!-- Vol Up (left) -->
    <rect x="${frameX - btnW}" y="${volUpY}" width="${btnW}" height="${volUpH}" rx="2" fill="url(#btn)"/>

    <!-- Vol Down (left) -->
    <rect x="${frameX - btnW}" y="${volDownY}" width="${btnW}" height="${volDownH}" rx="2" fill="url(#btn)"/>

    <!-- Action (left) -->
    <rect x="${frameX - btnW}" y="${actionY}" width="${btnW}" height="${actionH}" rx="2" fill="url(#btn)"/>

    <!-- Home indicator -->
    <rect x="${hiX}" y="${hiY}" width="${hiW}" height="${hiH}" rx="${hiR}" fill="rgba(255,255,255,0.15)"/>
  </svg>`;
}

async function redoMockup(lang, pos) {
  // Extract from backup (original 0.70 ratio) for best quality
  const backupPath = path.join(BACKUP_DIR, lang, DEVICE, `pos${pos}.png`);
  const outputPath = path.join(MOCKUPS_DIR, lang, DEVICE, `pos${pos}.png`);

  const sourcePath = fs.existsSync(backupPath) ? backupPath : outputPath;
  if (!fs.existsSync(sourcePath)) {
    console.log(`SKIP: ${lang}/pos${pos}`);
    return false;
  }

  // 1. Extract screen from source
  const screenBuf = await sharp(sourcePath)
    .extract({ left: SRC_X, top: SRC_Y, width: SRC_W, height: SRC_H })
    .png()
    .toBuffer();

  // 2. Resize to new phone dimensions
  const resized = await sharp(screenBuf)
    .resize(phoneW, phoneH, { fit: 'fill' })
    .png()
    .toBuffer();

  // 3. Round corners
  const mask = `<svg width="${phoneW}" height="${phoneH}"><rect width="${phoneW}" height="${phoneH}" rx="${cornerR}" fill="white"/></svg>`;
  const masked = await sharp(resized)
    .composite([{ input: Buffer.from(mask), blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 4. Create frame SVG
  const bg = await sharp(Buffer.from(createFrameSVG(pos, lang)))
    .resize(mockW, mockH)
    .png()
    .toBuffer();

  // 5. Composite
  const final = await sharp(bg)
    .composite([{ input: masked, top: phoneY, left: phoneX }])
    .flatten({ background: GRADIENTS[pos][0] })
    .png({ quality: 92 })
    .toBuffer();

  // 6. Verify & save
  const m = await sharp(final).metadata();
  const out = (m.width === mockW && m.height === mockH)
    ? final
    : await sharp(final).resize(mockW, mockH, { fit: 'fill' }).png().toBuffer();

  fs.writeFileSync(outputPath, out);
  return true;
}

async function main() {
  console.log('=== iPhone 16 Pro Max Mockup — Ultra-Thin Bezel ===');
  console.log(`Phone: ${phoneW}x${phoneH} at (${phoneX},${phoneY})`);
  console.log(`Frame: ${frameW}x${frameH}, bezel: ${bezelW}px, corner: ${cornerR}px\n`);

  let ok = 0, total = 0;
  for (const lang of LANGS) {
    for (let pos = 1; pos <= 10; pos++) {
      total++;
      try {
        if (await redoMockup(lang, pos)) { ok++; process.stdout.write('.'); }
      } catch (e) {
        console.log(`\nHATA ${lang}/pos${pos}: ${e.message}`);
      }
    }
    process.stdout.write(` ${lang} ✓\n`);
  }

  console.log(`\n${ok}/${total} mockup oluşturuldu`);

  // Verify
  for (const lang of LANGS) {
    const p = path.join(MOCKUPS_DIR, lang, DEVICE, 'pos1.png');
    if (fs.existsSync(p)) {
      const m = await sharp(p).metadata();
      console.log(`  ${lang}: ${m.width}x${m.height} ${m.width === mockW && m.height === mockH ? '✓' : '✗'}`);
    }
  }
}

main().catch(e => console.error('FATAL:', e));
