/**
 * Kredy iOS Screenshot Pipeline
 * Puppeteer ile ekran yakalar, Sharp ile mockup oluşturur
 */

import puppeteer from 'puppeteer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'store-deployment', 'screenshots');

const BASE_URL = 'http://localhost:5201';

// ── Desteklenen diller ──────────────────────────────────────
const LANGUAGES = ['tr', 'en', 'ar', 'ru', 'uk'];

// ── 10 ekran pozisyonu ─────────────────────────────────────
const SCREENS = [
  { pos: '01', role: 'HERO',          path: '/',                  headlines: { tr: 'Finansını Kontrol Et', en: 'Take Control of Your Money', ar: 'تحكم في أموالك', ru: 'Управляй финансами', uk: 'Керуй фінансами' }, subtitles: { tr: 'Tüm kartların tek yerde', en: 'All your cards in one place', ar: 'كل بطاقاتك في مكان واحد', ru: 'Все карты в одном месте', uk: 'Всі картки в одному місці' } },
  { pos: '02', role: 'DIFFERENTIATOR', path: '/analytics',         headlines: { tr: 'Harcamalarını Analiz Et', en: 'Analyze Your Spending', ar: 'حلل نفقاتك', ru: 'Анализируй расходы', uk: 'Аналізуй витрати' }, subtitles: { tr: 'Görsel grafikler ve raporlar', en: 'Visual charts and reports', ar: 'مخططات وتقارير مرئية', ru: 'Наглядные графики и отчёты', uk: 'Наочні графіки та звіти' } },
  { pos: '03', role: 'WOW',           path: '/wallet',            headlines: { tr: 'Kredi Kartı Asistanın', en: 'Your Credit Card Assistant', ar: 'مساعد بطاقة الائتمان', ru: 'Помощник по кредитным картам', uk: 'Асистент кредитних карток' }, subtitles: { tr: 'Ekstre, limit, vade takibi', en: 'Statement, limit, due date tracking', ar: 'تتبع الكشف والحد والتاريخ', ru: 'Выписка, лимит, срок платежа', uk: 'Виписка, ліміт, дата платежу' } },
  { pos: '04', role: 'WORKFLOW',      path: '/finance',           headlines: { tr: 'Bütçeni Yönet', en: 'Manage Your Budget', ar: 'أدر ميزانيتك', ru: 'Управляй бюджетом', uk: 'Керуй бюджетом' }, subtitles: { tr: 'Gelir ve gider dengesi', en: 'Income and expense balance', ar: 'توازن الدخل والمصروفات', ru: 'Баланс доходов и расходов', uk: 'Баланс доходів та витрат' } },
  { pos: '05', role: 'FEATURE',       path: '/investments',       headlines: { tr: 'Yatırımlarını Takip Et', en: 'Track Your Investments', ar: 'تتبع استثماراتك', ru: 'Следи за инвестициями', uk: 'Відстежуй інвестиції' }, subtitles: { tr: 'Altın, döviz, hisse, kripto', en: 'Gold, forex, stocks, crypto', ar: 'ذهب، عملات، أسهم، كريبتو', ru: 'Золото, валюта, акции, крипто', uk: 'Золото, валюта, акції, крипто' } },
  { pos: '06', role: 'ORGANIZE',      path: '/loans',             headlines: { tr: 'Kredilerini Simüle Et', en: 'Simulate Your Loans', ar: 'محاكاة قروضك', ru: 'Симулируй кредиты', uk: 'Симулюй кредити' }, subtitles: { tr: 'Ödeme planı ve taksit hesabı', en: 'Payment plan and installment calc', ar: 'خطة السداد وحساب الأقساط', ru: 'График платежей и расчёт рассрочки', uk: 'Графік платежів та розрахунок' } },
  { pos: '07', role: 'CUSTOMIZE',     path: '/menu',              headlines: { tr: 'Seni İçin Özelleştir', en: 'Personalize For You', ar: 'خصص لك', ru: 'Настрой под себя', uk: 'Налаштуй для себе' }, subtitles: { tr: '8 tema, 5 dil desteği', en: '8 themes, 5 languages', ar: '8 سمات، 5 لغات', ru: '8 тем, 5 языков', uk: '8 тем, 5 мов' } },
  { pos: '08', role: 'ANALYTICS',     path: '/ai-insights',       headlines: { tr: 'Yapay Zeka Asistanın', en: 'Your AI Financial Assistant', ar: 'مساعدك المالي بالذكاء الاصطناعي', ru: 'Твой ИИ финансовый помощник', uk: 'Твій ШІ фінансовий асистент' }, subtitles: { tr: 'Akıllı öneriler ve analizler', en: 'Smart recommendations and insights', ar: 'توصيات وتحليلات ذكية', ru: 'Умные рекомендации и анализ', uk: 'Розумні рекомендації та аналіз' } },
  { pos: '09', role: 'PREMIUM',       path: '/subscription',      headlines: { tr: 'PRO ile Sınırsız', en: 'Unlimited with PRO', ar: 'بلا حدود مع PRO', ru: 'Безлимитно с PRO', uk: 'Необмежено з PRO' }, subtitles: { tr: 'AI, widget, aile senkronizasyonu', en: 'AI, widgets, family sync', ar: 'ذكاء اصطناعي، ودجت، مزامنة عائلية', ru: 'ИИ, виджеты, семейная синхронизация', uk: 'ШІ, віджети, сімейна синхронізація' } },
  { pos: '10', role: 'TRUST',         path: '/family',            headlines: { tr: 'Aile ile Birlikte Yönet', en: 'Manage Together as Family', ar: 'أدر معاً كعائلة', ru: 'Управляйте вместе семьёй', uk: 'Керуйте разом як сім\'я' }, subtitles: { tr: 'Gerçek zamanlı senkronizasyon', en: 'Real-time synchronization', ar: 'مزامنة في الوقت الفعلي', ru: 'Синхронизация в реальном времени', uk: 'Синхронізація в реальному часі' } },
];

// ── Gradient presetleri ────────────────────────────────────
const GRADIENTS = {
  FINANCE: ['#0f172a', '#1e3a5f', '#1e40af'],
};

// ── Cihaz konfigürasyonları ────────────────────────────────
const DEVICES = {
  'appstore-6.9': {
    viewport: { width: 420, height: 912 },
    scale: 3,
    output: { w: 1260, h: 2736 },
    type: 'iphone',
  },
  'appstore-ipad-13': {
    viewport: { width: 1032, height: 1376 },
    scale: 2,
    output: { w: 2064, h: 2752 },
    type: 'ipad',
  },
};

// ── Premium subscription data inject ──────────────────────
function buildSubscriptionData() {
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  return JSON.stringify({
    plan: 'yearly',
    activatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt,
    isTrialPeriod: false,
  });
}

// ── Demo verisi oluştur ────────────────────────────────────
function buildDemoData(lang) {
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

  const cards = [
    { id: 'c1', name: 'Garanti BBVA Bonus', lastFour: '4521', limit: 25000, currentDebt: 8750, color: '#10b981', network: 'Visa', billingDay: 15, dueDay: 5 },
    { id: 'c2', name: 'Yapı Kredi World', lastFour: '7832', limit: 15000, currentDebt: 3200, color: '#3b82f6', network: 'Mastercard', billingDay: 20, dueDay: 10 },
    { id: 'c3', name: 'İş Bankası Maximum', lastFour: '2947', limit: 20000, currentDebt: 11500, color: '#8b5cf6', network: 'Visa', billingDay: 25, dueDay: 15 },
  ];

  const transactions = Array.from({ length: 30 }, (_, i) => ({
    id: `t${i}`,
    amount: Math.round(50 + Math.random() * 500),
    category: ['Market', 'Restoran', 'Akaryakıt', 'Fatura', 'Alışveriş'][i % 5],
    description: ['Migros', 'Starbucks', 'Shell', 'Elektrik', 'Zara'][i % 5],
    date: daysAgo(i),
    type: i % 4 === 0 ? 'income' : 'expense',
    cardId: cards[i % 3].id,
  }));

  return { cards, transactions };
}

// ── Sayfa yüklenmeden önce localStorage set et ──────────────
async function setupPageDefaults(page, lang) {
  const subData = buildSubscriptionData();
  const { cards, transactions } = buildDemoData(lang);
  // evaluateOnNewDocument: her yeni sayfa yüklenişinde DOM oluşmadan çalışır
  await page.evaluateOnNewDocument((args) => {
    const { subData, cardsStr, transactionsStr, lang } = args;
    localStorage.setItem('kredi-pusula-iap-subscription', subData);
    localStorage.setItem('kredi-pusula-cards', cardsStr);
    localStorage.setItem('kredi-pusula-personal-transactions', transactionsStr);
    localStorage.setItem('i18nextLng', lang);
    localStorage.setItem('language', lang);
    localStorage.setItem('kredi-pusula-simple-mode', 'false');
    localStorage.setItem('kredi-pusula-onboarding-completed', 'true');
    localStorage.setItem('kredi-pusula-permissions-completed', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('welcomeSeen', 'true');
    localStorage.setItem('kredi-pusula-migration-v2-done', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('kredi-pusula-privacy-mode', 'false');
    localStorage.setItem('privacy-mode', 'false');
    localStorage.removeItem('kredi-pusula-pin-hash');
    localStorage.removeItem('kredi-pusula-pin-hint1');
    localStorage.removeItem('kredi-pusula-pin-hint2');
    localStorage.setItem('kredi-pusula-user-profile', JSON.stringify({ name: 'Gökhan Alpatar', email: 'demo@kredy.app' }));
  }, { subData, cardsStr: JSON.stringify(cards), transactionsStr: JSON.stringify(transactions), lang });
}

// ── localStorage inject (sayfa yüklendikten sonra) ───────────
async function injectDemoState(page, lang) {
  const subData = buildSubscriptionData();
  const { cards, transactions } = buildDemoData(lang);

  await page.evaluate((args) => {
    const { subData, cardsStr, transactionsStr, lang } = args;
    localStorage.setItem('kredi-pusula-iap-subscription', subData);
    localStorage.setItem('kredi-pusula-cards', cardsStr);
    localStorage.setItem('kredi-pusula-personal-transactions', transactionsStr);
    localStorage.setItem('i18nextLng', lang);
    localStorage.setItem('language', lang);
    localStorage.setItem('kredi-pusula-simple-mode', 'false');
    localStorage.setItem('kredi-pusula-onboarding-completed', 'true');
    localStorage.setItem('kredi-pusula-permissions-completed', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('welcomeSeen', 'true');
    localStorage.setItem('kredi-pusula-migration-v2-done', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('kredi-pusula-privacy-mode', 'false');
    localStorage.setItem('privacy-mode', 'false');
    localStorage.removeItem('kredi-pusula-pin-hash');
    localStorage.removeItem('kredi-pusula-pin-hint1');
    localStorage.removeItem('kredi-pusula-pin-hint2');
  }, { subData, cardsStr: JSON.stringify(cards), transactionsStr: JSON.stringify(transactions), lang });
}

// ── Ekranı temizle ────────────────────────────────────────
async function cleanScreen(page) {
  await page.evaluate(() => {
    // Overlay/modal kaldır
    const removeSelectors = [
      '.modal-backdrop', '.modal-overlay', '[class*="overlay"]',
      '[class*="popup"]', '[class*="toast"]', '[class*="onboarding"]',
      '[role="dialog"]', '[aria-modal="true"]',
    ];
    removeSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });

    // Scrollbar gizle
    const style = document.createElement('style');
    style.textContent = `*::-webkit-scrollbar{display:none!important}body{-ms-overflow-style:none!important}`;
    document.head.appendChild(style);

    // Fiyat gizle
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent;
      if (/[$€£¥₺₹₩₽]\s*[\d.,]+/.test(text)) {
        const parent = walker.currentNode.parentElement;
        if (parent && !['SCRIPT','STYLE'].includes(parent.tagName)) {
          parent.style.visibility = 'hidden';
        }
      }
    }

    window.scrollTo(0, 0);
  });
}

// ── Dark mode ─────────────────────────────────────────────
async function applyDarkMode(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('colorMode', 'dark');
  });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
}

async function resetToLight(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('colorMode', 'light');
  });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
}

// ── Sharp ile mockup oluştur ─────────────────────────────
async function createMockup(rawPath, outPath, deviceKey, lang, screen) {
  const deviceConf = DEVICES[deviceKey];
  const { w: W, h: H } = deviceConf.output;
  const colors = GRADIENTS.FINANCE;
  const isIpad = deviceConf.type === 'ipad';

  // Gradient arka plan (SVG ile)
  const gradSvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stop-color="${colors[0]}"/>
          <stop offset="50%" stop-color="${colors[1]}"/>
          <stop offset="100%" stop-color="${colors[2]}"/>
        </linearGradient>
        <!-- Bokeh daireler -->
        <radialGradient id="b1" cx="20%" cy="15%" r="40%">
          <stop offset="0%" stop-color="${colors[1]}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${colors[0]}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="b2" cx="80%" cy="70%" r="35%">
          <stop offset="0%" stop-color="${colors[2]}" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="${colors[0]}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bg)"/>
      <rect width="${W}" height="${H}" fill="url(#b1)"/>
      <rect width="${W}" height="${H}" fill="url(#b2)"/>
    </svg>
  `;

  // Device frame boyutları
  const bezel = isIpad ? 24 : 16;
  const outerR = isIpad ? 36 : 58;
  const innerR = isIpad ? 28 : 50;

  // Layout A: Headline üstte, device ortada
  const headlineY = Math.round(H * 0.08);
  const deviceH = Math.round(H * 0.63);
  const rawImg = sharp(rawPath);
  const rawMeta = await rawImg.metadata();
  const screenAspect = rawMeta.width / rawMeta.height;
  const innerScreenH = deviceH - bezel * 2;
  const innerScreenW = Math.round(innerScreenH * screenAspect);
  const frameW = innerScreenW + bezel * 2;
  const deviceX = Math.round((W - frameW) / 2);
  const deviceY = Math.round(H * 0.25);

  // Headline metin (SVG text)
  const headlineText = screen.headlines[lang] || screen.headlines.en;
  const subtitleText = screen.subtitles?.[lang] || screen.subtitles?.en || '';
  const fontSize = Math.min(Math.max(Math.round(H * 0.030), 68), 96);
  const subSize = Math.round(fontSize * 0.48);

  // RTL dil kontrolü
  const isRTL = ['ar'].includes(lang);
  const textAnchor = 'middle';

  // Headline satır sayısı — 2 satıra böl
  const words = headlineText.split(' ');
  const midIdx = Math.ceil(words.length / 2);
  const line1 = words.slice(0, midIdx).join(' ');
  const line2 = words.slice(midIdx).join(' ');

  // Frame + shadow SVG
  const shadowOpacity = 0.4;
  const frameSvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Gölge -->
      <filter id="shadow">
        <feDropShadow dx="0" dy="30" stdDeviation="40" flood-color="rgba(0,0,0,${shadowOpacity})"/>
      </filter>
      <!-- Device frame gövde -->
      <rect x="${deviceX}" y="${deviceY}" width="${frameW}" height="${deviceH}"
            rx="${outerR}" ry="${outerR}" fill="#1C1C1E" filter="url(#shadow)"/>
      <!-- Parlak kenar -->
      <rect x="${deviceX + 0.5}" y="${deviceY + 0.5}" width="${frameW - 1}" height="${deviceH - 1}"
            rx="${outerR}" ry="${outerR}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
      <!-- Ekran alanı -->
      <rect x="${deviceX + bezel}" y="${deviceY + bezel}" width="${innerScreenW}" height="${innerScreenH}"
            rx="${innerR}" ry="${innerR}" fill="#000"/>
      ${isIpad
        ? `<!-- iPad kamera --><circle cx="${deviceX + frameW/2}" cy="${deviceY + bezel/2}" r="5" fill="#1a1a1a"/>`
        : `<!-- Dynamic Island --><rect x="${deviceX + frameW/2 - 63}" y="${deviceY + bezel + 10}" width="126" height="35" rx="17" ry="17" fill="#000"/>`
      }
      ${isIpad
        ? `<!-- iPad home indicator --><rect x="${deviceX + frameW/2 - 90}" y="${deviceY + deviceH - bezel - 14}" width="180" height="5" rx="2.5" fill="rgba(255,255,255,0.25)"/>`
        : `<!-- Home indicator --><rect x="${deviceX + frameW/2 - 70}" y="${deviceY + deviceH - bezel - 16}" width="140" height="5" rx="2.5" fill="rgba(255,255,255,0.28)"/>`
      }

      <!-- Headline -->
      <text x="${W/2}" y="${headlineY + fontSize}"
            font-family="-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            font-size="${fontSize}" font-weight="900" fill="white" text-anchor="${textAnchor}"
            ${isRTL ? 'direction="rtl"' : ''}
            filter="url(#textShadow)">
        ${line1}
      </text>
      ${line2 ? `<text x="${W/2}" y="${headlineY + fontSize * 2.1}"
            font-family="-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            font-size="${fontSize}" font-weight="900" fill="white" text-anchor="${textAnchor}"
            ${isRTL ? 'direction="rtl"' : ''}
            filter="url(#textShadow)">
        ${line2}
      </text>` : ''}

      <!-- Subtitle -->
      ${subtitleText ? `<text x="${W/2}" y="${headlineY + fontSize * (line2 ? 3.3 : 2.1)}"
            font-family="-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            font-size="${subSize}" font-weight="600" fill="rgba(255,255,255,0.72)" text-anchor="${textAnchor}"
            ${isRTL ? 'direction="rtl"' : ''}>
        ${subtitleText}
      </text>` : ''}

      <defs>
        <filter id="textShadow">
          <feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
    </svg>
  `;

  // Screenshot'ı device frame boyutuna getir
  const screenBuf = await sharp(rawPath)
    .resize(innerScreenW, innerScreenH, { fit: 'cover' })
    .png()
    .toBuffer();

  // Rounded corner mask for screenshot
  const maskSvg = `<svg width="${innerScreenW}" height="${innerScreenH}">
    <rect width="${innerScreenW}" height="${innerScreenH}" rx="${innerR}" ry="${innerR}" fill="white"/>
  </svg>`;

  const maskedScreen = await sharp(screenBuf)
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Final kompozit
  await sharp({
    create: { width: W, height: H, channels: 3, background: { r: 15, g: 23, b: 42 } }
  })
    .composite([
      // Arka plan gradient
      { input: Buffer.from(gradSvg), top: 0, left: 0 },
      // Frame + text overlay
      { input: Buffer.from(frameSvg), top: 0, left: 0 },
      // Screenshot ekran içine
      { input: maskedScreen, top: deviceY + bezel, left: deviceX + bezel },
    ])
    .flatten({ background: { r: 15, g: 23, b: 42 } })
    .toColorspace('srgb')
    .png()
    .toFile(outPath);
}

// ── Ana pipeline ──────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Kredy iOS Screenshot Pipeline           ║');
  console.log('║  Platform: iOS (6.9" iPhone + 13" iPad) ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security',
           '--disable-features=IsolateOrigins,site-per-process'],
  });

  const page = await browser.newPage();
  page.on('pageerror', err => console.error('[PAGE ERR]', err.message));

  // ── Cihaz grupları sırayla ────────────────────────────
  for (const [deviceKey, deviceConf] of Object.entries(DEVICES)) {
    console.log(`\n══ ${deviceKey} (${deviceConf.output.w}x${deviceConf.output.h}) ══`);

    await page.setViewport({
      width: deviceConf.viewport.width,
      height: deviceConf.viewport.height,
      deviceScaleFactor: deviceConf.scale,
      isMobile: deviceConf.type === 'iphone',
      hasTouch: true,
      isLandscape: false,
    });

    // ── Her dil ───────────────────────────────────────
    for (const lang of LANGUAGES) {
      console.log(`\n  [${lang.toUpperCase()}] İşleniyor...`);

      const rawLangDir = path.join(OUT, 'raw', deviceKey, lang);
      const mockupLangDir = path.join(OUT, 'mockups', deviceKey, lang);
      fs.mkdirSync(rawLangDir, { recursive: true });
      fs.mkdirSync(mockupLangDir, { recursive: true });

      const isRTL = ['ar'].includes(lang);

      // Sayfa yüklenmeden önce localStorage hazırla (evaluateOnNewDocument)
      await setupPageDefaults(page, lang);

      // İlk sayfayı yükle + state inject et
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await injectDemoState(page, lang);

      if (isRTL) {
        await page.evaluate((l) => {
          document.documentElement.dir = 'rtl';
          document.documentElement.lang = l;
        }, lang);
      }

      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));

      // ── Her ekran ─────────────────────────────────
      for (const screen of SCREENS) {
        const rawFile = `${screen.pos}-${screen.role.toLowerCase()}.png`;
        const rawPath = path.join(rawLangDir, rawFile);
        const mockupPath = path.join(mockupLangDir, rawFile);

        // Dark mode (CUSTOMIZE ekranı)
        const isDark = screen.role === 'CUSTOMIZE';
        if (isDark) {
          await applyDarkMode(page);
          await injectDemoState(page, lang);
        }

        // Sayfaya git
        const url = `${BASE_URL}${screen.path}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1200));

        // State tekrar inject (navigation sonrası kaybolabilir)
        await injectDemoState(page, lang);
        if (isRTL) {
          await page.evaluate((l) => {
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = l;
          }, lang);
        }
        await new Promise(r => setTimeout(r, 800));

        await cleanScreen(page);
        await new Promise(r => setTimeout(r, 300));

        // Screenshot al
        await page.screenshot({ path: rawPath, type: 'png', fullPage: false });
        console.log(`    ✓ raw: ${rawFile}`);

        // Dark mode resetle
        if (isDark) await resetToLight(page);

        // Mockup oluştur
        await createMockup(rawPath, mockupPath, deviceKey, lang, screen);
        console.log(`    ✓ mockup: ${rawFile}`);
      }

      console.log(`  ✓ ${lang}: 10 screenshot + 10 mockup tamamlandı`);
    }

    console.log(`\n✓ ${deviceKey} tamamlandı`);
  }

  await browser.close();

  // ── Rapor ─────────────────────────────────────────────
  const totalMockups = Object.keys(DEVICES).length * LANGUAGES.length * SCREENS.length;
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  SONUÇ                                   ║');
  console.log(`║  Toplam mockup: ${totalMockups}                        ║`);
  console.log(`║  Cihaz: ${Object.keys(DEVICES).length} (6.9" iPhone + 13" iPad)  ║`);
  console.log(`║  Dil: ${LANGUAGES.length} (TR, EN, AR, RU, UK)         ║`);
  console.log('║  Çıktı: store-deployment/screenshots/    ║');
  console.log('╚══════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('HATA:', err);
  process.exit(1);
});
