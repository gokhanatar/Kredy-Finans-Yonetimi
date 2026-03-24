#!/usr/bin/env node
/**
 * Remake mockups with proper iPhone/iPad device frames
 * Extracts screen from existing mockups, adds realistic device frame, re-composites
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = '/Users/neslihan/Desktop/uygulama/Kredy';
const MOCKUPS_DIR = path.join(ROOT, 'screenshots/mockups');

const IOS_DEVICES = {
  'iphone-6.9': { width: 430, height: 932, scale: 3, mockW: 1290, mockH: 2796 },
  'iphone-5.5': { width: 414, height: 736, scale: 3, mockW: 1242, mockH: 2208 },
  'ipad-13':    { width: 1032, height: 1376, scale: 2, mockW: 2064, mockH: 2752 },
};

const ALL_LANGUAGES = ['tr', 'en', 'ar', 'ru', 'uk'];

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

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function createMockupSVG(mockW, mockH, pos, lang, device) {
  const hl = (HEADLINES[lang] || HEADLINES.tr)[pos];
  const grad = GRADIENTS[pos];
  const isIPad = device.includes('ipad');
  const is55 = device === 'iphone-5.5';

  // --- Device frame dimensions ---
  const frameRatio = isIPad ? 0.68 : 0.70;
  const phoneW = Math.round(mockW * frameRatio);
  const dev = IOS_DEVICES[device];
  const rawW = dev.width * dev.scale;
  const rawH = dev.height * dev.scale;
  const phoneH = Math.round(rawH * (phoneW / rawW));
  const phoneX = Math.round((mockW - phoneW) / 2);
  const phoneY = mockH - phoneH - Math.round(mockH * 0.03);

  // --- iPhone frame specs --- THICK, CLEARLY VISIBLE
  const cornerR = isIPad ? 36 : (is55 ? 40 : 52);
  const bezelW = isIPad ? 20 : (is55 ? 18 : 16);
  const frameW = phoneW + bezelW * 2;
  const frameH = phoneH + bezelW * 2;
  const frameX = phoneX - bezelW;
  const frameY = phoneY - bezelW;
  const frameR = cornerR + bezelW;

  // Dynamic Island — CLEARLY VISIBLE
  const hasDI = device === 'iphone-6.9';
  const diW = Math.round(phoneW * 0.30);
  const diH = Math.round(phoneW * 0.09);
  const diX = phoneX + Math.round((phoneW - diW) / 2);
  const diY = phoneY + Math.round(phoneH * 0.014);
  const diR = Math.round(diH / 2);

  // Home indicator — visible white bar
  const hiW = isIPad ? Math.round(phoneW * 0.28) : Math.round(phoneW * 0.38);
  const hiH = isIPad ? 8 : 7;
  const hiX = phoneX + Math.round((phoneW - hiW) / 2);
  const hiY = phoneY + phoneH - Math.round(phoneH * 0.018) - hiH;
  const hiR = Math.round(hiH / 2);

  // 5.5" has home button
  const hasHomeBtn = is55;
  const hbR = Math.round(phoneW * 0.065);
  const hbX = phoneX + Math.round(phoneW / 2);
  const hbY = phoneY + phoneH + bezelW + Math.round(hbR * 1.3);
  const frameHAdj = hasHomeBtn ? frameH + hbR * 3.2 : frameH;

  // Side buttons — clearly visible
  const btnW = 6;
  const powerBtnH = Math.round(phoneH * 0.08);
  const powerBtnY = phoneY + Math.round(phoneH * 0.18);
  const volUpH = Math.round(phoneH * 0.06);
  const volDownH = Math.round(phoneH * 0.06);
  const volUpY = phoneY + Math.round(phoneH * 0.14);
  const volDownY = volUpY + volUpH + Math.round(phoneH * 0.02);

  // --- Text ---
  const titleLines = hl.title.split('\n');
  const maxLineLen = Math.max(...titleLines.map(l => l.length));
  const baseTitleSize = isIPad ? 80 : (is55 ? 60 : 72);
  const titleSize = maxLineLen > 18 ? Math.round(baseTitleSize * 0.70) :
                    maxLineLen > 14 ? Math.round(baseTitleSize * 0.80) : baseTitleSize;
  const baseSubSize = isIPad ? 38 : (is55 ? 28 : 34);
  const subLen = hl.sub.length;
  const subSize = subLen > 40 ? Math.round(baseSubSize * 0.75) :
                  subLen > 30 ? Math.round(baseSubSize * 0.85) : baseSubSize;

  const titleY = Math.round(mockH * 0.04);
  const fontStack = 'system-ui, -apple-system, sans-serif';

  const titleSVG = titleLines.map((l, i) =>
    `<text x="${mockW/2}" y="${titleY + (i+1)*(titleSize*1.2)}" text-anchor="middle" font-family="${fontStack}" font-size="${titleSize}" font-weight="900" fill="white" letter-spacing="-0.02em"><tspan>${esc(l)}</tspan></text>`
  ).join('');
  const subY = titleY + titleLines.length * (titleSize * 1.2) + subSize * 1.5;

  // Frame color - dark titanium for clear visibility
  const frameColor = is55 ? '#1C1C1E' : '#3A3A3C';
  const frameDarkColor = is55 ? '#0A0A0A' : '#1C1C1E';
  const frameHighlight = is55 ? '#4A4A4C' : '#5A5A5E';

  let svg = `<svg width="${mockW}" height="${mockH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${grad[0]}"/>
        <stop offset="50%" stop-color="${grad[1]}"/>
        <stop offset="100%" stop-color="${grad[2]}"/>
      </linearGradient>
      <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${frameColor}"/>
        <stop offset="50%" stop-color="${frameDarkColor}"/>
        <stop offset="100%" stop-color="${frameColor}"/>
      </linearGradient>
      <filter id="frameShadow">
        <feDropShadow dx="0" dy="16" stdDeviation="32" flood-color="rgba(0,0,0,0.5)"/>
      </filter>
    </defs>

    <!-- Background gradient -->
    <rect width="${mockW}" height="${mockH}" fill="url(#bg)"/>

    <!-- Title text -->
    ${titleSVG}
    <text x="${mockW/2}" y="${subY}" text-anchor="middle" font-family="${fontStack}" font-size="${subSize}" font-weight="600" fill="rgba(255,255,255,0.85)"><tspan>${esc(hl.sub)}</tspan></text>

    <!-- Device frame shadow -->
    <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameHAdj}" rx="${frameR}" fill="black" filter="url(#frameShadow)" opacity="0.6"/>

    <!-- Device outer frame -->
    <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameHAdj}" rx="${frameR}" fill="${frameDarkColor}"/>

    <!-- Device inner bezel (lighter edge for 3D effect) -->
    <rect x="${frameX+2}" y="${frameY+2}" width="${frameW-4}" height="${frameHAdj-4}" rx="${frameR-2}" fill="url(#frame)"/>

    <!-- Top edge highlight (metallic shine) -->
    <rect x="${frameX+4}" y="${frameY+2}" width="${frameW-8}" height="${Math.round(frameHAdj*0.004)}" rx="2" fill="${frameHighlight}" opacity="0.6"/>

    <!-- Screen bezel inner shadow -->
    <rect x="${phoneX-1}" y="${phoneY-1}" width="${phoneW+2}" height="${phoneH+2}" rx="${cornerR+1}" fill="#000"/>

    <!-- Screen area -->
    <rect x="${phoneX}" y="${phoneY}" width="${phoneW}" height="${phoneH}" rx="${cornerR}" fill="#000"/>`;

  // Side buttons (not for iPad)
  if (!isIPad) {
    // Power button (right side) — thick and visible
    svg += `
    <rect x="${frameX + frameW - 1}" y="${powerBtnY}" width="${btnW + 2}" height="${powerBtnH}" rx="3" fill="${frameDarkColor}"/>
    <rect x="${frameX + frameW}" y="${powerBtnY + 1}" width="${btnW}" height="${powerBtnH - 2}" rx="2" fill="${frameColor}"/>`;
    // Volume buttons (left side)
    svg += `
    <rect x="${frameX - btnW - 1}" y="${volUpY}" width="${btnW + 2}" height="${volUpH}" rx="3" fill="${frameDarkColor}"/>
    <rect x="${frameX - btnW}" y="${volUpY + 1}" width="${btnW}" height="${volUpH - 2}" rx="2" fill="${frameColor}"/>
    <rect x="${frameX - btnW - 1}" y="${volDownY}" width="${btnW + 2}" height="${volDownH}" rx="3" fill="${frameDarkColor}"/>
    <rect x="${frameX - btnW}" y="${volDownY + 1}" width="${btnW}" height="${volDownH - 2}" rx="2" fill="${frameColor}"/>`;
    if (!is55) {
      // Action/mute button (above volume, smaller)
      const actionY = volUpY - Math.round(phoneH * 0.045);
      const actionH = Math.round(phoneH * 0.022);
      svg += `
      <rect x="${frameX - btnW - 1}" y="${actionY}" width="${btnW + 2}" height="${actionH}" rx="3" fill="${frameDarkColor}"/>
      <rect x="${frameX - btnW}" y="${actionY + 1}" width="${btnW}" height="${actionH - 2}" rx="2" fill="${frameColor}"/>`;
    }
  }

  // Dynamic Island (modern iPhones) — prominent, pill-shaped
  if (hasDI) {
    svg += `
    <rect x="${diX}" y="${diY}" width="${diW}" height="${diH}" rx="${diR}" fill="#000"/>
    <rect x="${diX + 2}" y="${diY + 2}" width="${diW - 4}" height="${diH - 4}" rx="${diR - 2}" fill="#111"/>
    <circle cx="${diX + diW - Math.round(diH * 0.6)}" cy="${diY + Math.round(diH / 2)}" r="${Math.round(diH * 0.22)}" fill="#1a1a2e"/>`;
  }

  // Home button (5.5" only) — classic circle with ring
  if (hasHomeBtn) {
    svg += `
    <circle cx="${hbX}" cy="${hbY}" r="${hbR}" fill="${frameDarkColor}"/>
    <circle cx="${hbX}" cy="${hbY}" r="${hbR - 2}" fill="${frameColor}"/>
    <circle cx="${hbX}" cy="${hbY}" r="${Math.round(hbR * 0.72)}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2.5"/>
    <rect x="${hbX - Math.round(hbR * 0.2)}" y="${hbY - Math.round(hbR * 0.2)}" width="${Math.round(hbR * 0.4)}" height="${Math.round(hbR * 0.4)}" rx="${Math.round(hbR * 0.08)}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>`;
  }

  // Home indicator (modern devices, not 5.5") — white bar at bottom
  if (!hasHomeBtn) {
    svg += `
    <rect x="${hiX}" y="${hiY}" width="${hiW}" height="${hiH}" rx="${hiR}" fill="rgba(0,0,0,0.3)"/>`;
  }

  svg += `\n  </svg>`;

  return { svg, phoneX, phoneY, phoneW, phoneH, cornerR };
}

async function remakeMockup(lang, device, pos) {
  const dev = IOS_DEVICES[device];
  const { mockW, mockH } = dev;
  const mockupPath = path.join(MOCKUPS_DIR, lang, device, `pos${pos}.png`);

  if (!fs.existsSync(mockupPath)) {
    console.log(`EKSIK: ${mockupPath}`);
    return false;
  }

  // Extract screen from existing mockup
  const oldPhoneW = Math.round(mockW * 0.78);
  const oldPhoneH = Math.round((dev.height * dev.scale) * (oldPhoneW / (dev.width * dev.scale)));
  const oldPhoneX = Math.round((mockW - oldPhoneW) / 2);
  const oldPhoneY = mockH - oldPhoneH - Math.round(mockH * 0.04);

  // Extract the screen area
  const screenBuf = await sharp(mockupPath)
    .extract({ left: oldPhoneX, top: oldPhoneY, width: oldPhoneW, height: oldPhoneH })
    .png().toBuffer();

  // Create new mockup SVG with iPhone frame
  const { svg, phoneX, phoneY, phoneW, phoneH, cornerR } = createMockupSVG(mockW, mockH, pos, lang, device);

  // Resize extracted screen to new phone dimensions
  const resizedScreen = await sharp(screenBuf)
    .resize(phoneW, phoneH, { fit: 'fill' })
    .png().toBuffer();

  // Create rounded corner mask for screen
  const maskSvg = `<svg width="${phoneW}" height="${phoneH}"><rect width="${phoneW}" height="${phoneH}" rx="${cornerR}" fill="white"/></svg>`;
  const maskedScreen = await sharp(resizedScreen)
    .composite([{
      input: Buffer.from(maskSvg),
      blend: 'dest-in'
    }])
    .png().toBuffer();

  // Compose: background SVG + masked screen
  const bgBuf = await sharp(Buffer.from(svg)).resize(mockW, mockH).png().toBuffer();
  const finalBuf = await sharp(bgBuf)
    .composite([{ input: maskedScreen, top: phoneY, left: phoneX }])
    .flatten({ background: GRADIENTS[pos][0] })
    .png({ quality: 90 })
    .toBuffer();

  // Verify dimensions
  const meta = await sharp(finalBuf).metadata();
  let output = finalBuf;
  if (meta.width !== mockW || meta.height !== mockH) {
    output = await sharp(finalBuf).resize(mockW, mockH, { fit: 'fill' }).png().toBuffer();
  }

  fs.writeFileSync(mockupPath, output);
  return true;
}

// ─── MAIN ───
async function main() {
  console.log('=== Remake Mockups with iPhone Frames ===\n');

  let total = 0;
  let ok = 0;

  for (const lang of ALL_LANGUAGES) {
    for (const device of Object.keys(IOS_DEVICES)) {
      for (let pos = 1; pos <= 10; pos++) {
        total++;
        try {
          const success = await remakeMockup(lang, device, pos);
          if (success) {
            ok++;
            process.stdout.write('.');
          }
        } catch (e) {
          console.log(`\nHATA ${lang}/${device}/pos${pos}: ${e.message}`);
        }
      }
      process.stdout.write(` ${lang}/${device}\n`);
    }
  }

  console.log(`\nTamamlandi: ${ok}/${total} mockup yeniden olusturuldu`);
}

main().catch(e => console.error('FATAL:', e.message));
