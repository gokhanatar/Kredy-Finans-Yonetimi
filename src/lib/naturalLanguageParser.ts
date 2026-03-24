// ============= TİPLER =============

export interface ParsedExpense {
  amount: number;
  category: string;
  merchant: string;
  date: string; // ISO string (YYYY-MM-DD)
  description: string;
  confidence: number; // 0-1 arası
}

// ============= SABİTLER =============

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Türkçe metin -> kategori eşleştirme haritası.
 * Anahtar kelimeler küçük harfle aranır.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  market: [
    'migros', 'bim', 'a101', 'şok', 'sok', 'carrefour', 'metro gross',
    'macro', 'file', 'hakmar', 'onur market', 'market', 'bakkal',
    'süpermarket', 'supermarket', 'gıda', 'manav', 'kasap', 'tesco',
  ],
  ulasim: [
    'uber', 'taksi', 'taxi', 'metro', 'metrobüs', 'otobüs', 'otobus',
    'dolmuş', 'dolmus', 'tramvay', 'vapur', 'marmaray', 'istanbulkart',
    'ankarakart', 'kentkart', 'thy', 'pegasus', 'anadolujet', 'uçak',
    'ucak', 'bilet', 'otogar', 'tren', 'bitaksi', 'ulaşım', 'ulasim',
  ],
  yemek: [
    'restoran', 'restaurant', 'lokanta', 'cafe', 'kafe', 'kahve', 'coffee',
    'starbucks', 'mcdonalds', 'burger king', 'kfc', 'dominos', 'pizza',
    'yemeksepeti', 'getir', 'trendyol yemek', 'yemek', 'kebap', 'döner',
    'doner', 'lahmacun', 'pide', 'simit', 'börek', 'borek', 'çay', 'cay',
  ],
  giyim: [
    'lc waikiki', 'h&m', 'zara', 'defacto', 'koton', 'mango', 'boyner',
    'vakko', 'mavi', 'colins', 'ipekyol', 'giyim', 'ayakkabı', 'ayakkabi',
    'kıyafet', 'kiyafet', 'tişört', 'tisort', 'pantolon', 'elbise',
  ],
  eglence: [
    'netflix', 'spotify', 'youtube', 'sinema', 'cinema', 'film', 'konser',
    'tiyatro', 'disney', 'playstation', 'xbox', 'steam', 'eğlence',
    'eglence', 'oyun', 'game', 'müze', 'muze', 'park', 'lunapark',
  ],
  fatura: [
    'türk telekom', 'turk telekom', 'vodafone', 'turkcell', 'elektrik',
    'doğalgaz', 'dogalgaz', 'su faturası', 'su faturasi', 'internet',
    'igdaş', 'igdas', 'enerjisa', 'fatura', 'aidat',
  ],
  saglik: [
    'eczane', 'pharmacy', 'hastane', 'hospital', 'klinik', 'clinic',
    'doktor', 'diş', 'dis', 'ilaç', 'ilac', 'sağlık', 'saglik',
    'medikal', 'medical', 'muayene', 'laboratuvar', 'röntgen',
  ],
  egitim: [
    'kitap', 'book', 'kırtasiye', 'kirtasiye', 'okul', 'üniversite',
    'universite', 'kurs', 'eğitim', 'egitim', 'dershane', 'udemy',
    'coursera', 'ödev', 'odev',
  ],
  ev: [
    'ikea', 'bauhaus', 'koçtaş', 'koctas', 'tekzen', 'praktiker',
    'mobilya', 'dekorasyon', 'ev', 'beyaz eşya', 'beyaz esya',
  ],
  tasit: [
    'benzin', 'akaryakıt', 'akarya', 'shell', 'opet', 'bp',
    'petrol ofisi', 'total', 'otopark', 'parking', 'araç', 'arac',
    'tamir', 'servis', 'lastik', 'yağ', 'yag', 'muayene',
  ],
  bakim: [
    'kuaför', 'kuafor', 'berber', 'güzellik', 'guzellik', 'makyaj',
    'bakım', 'bakim', 'spa', 'masaj', 'tırnak', 'tirnak', 'parfüm',
    'parfum', 'kozmetik',
  ],
  kira: ['kira', 'rent'],
  sigorta: ['sigorta', 'kasko', 'trafik sigortası', 'dask', 'poliçe'],
};

/**
 * Türkçe merchant (yer) adı çıkarma desenleri.
 * "da", "de", "ta", "te" ekleri veya tırnak/apostrof sonrası merchant ismi.
 */
const MERCHANT_PATTERNS: RegExp[] = [
  // "Migros'ta", "Bim'de", "A101'de"
  /([A-ZÇĞİÖŞÜa-zçğıöşü0-9]+)[''`](?:da|de|ta|te|dan|den|tan|ten)/i,
  // "Migros da", "market te" (ayrı yazılmış)
  /([A-ZÇĞİÖŞÜa-zçğıöşü0-9]+)\s+(?:da|de|ta|te)\s/i,
  // "X'e gittim", "X'a gittim"
  /([A-ZÇĞİÖŞÜa-zçğıöşü0-9]+)[''`](?:e|a|ye|ya)\s/i,
  // "X'den aldım"
  /([A-ZÇĞİÖŞÜa-zçğıöşü0-9]+)[''`](?:den|dan|ten|tan)\s/i,
];

/**
 * Türkçe tarih anahtar kelimeleri -> ISO tarih dönüşümü
 */
function parseTurkishDate(text: string): string | null {
  const today = new Date();

  const lower = text.toLowerCase();

  // "bugün"
  if (/bugün|bugun/.test(lower)) {
    return today.toISOString().split('T')[0];
  }

  // "dün"
  if (/dün|dun/.test(lower)) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  // "önceki gün" / "evvelsi gün"
  if (/önceki\s*gün|onceki\s*gun|evvelsi\s*gün|evvelsi\s*gun/.test(lower)) {
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);
    return dayBefore.toISOString().split('T')[0];
  }

  // "geçen hafta" (7 gün önce)
  if (/geçen\s*hafta|gecen\s*hafta/.test(lower)) {
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    return lastWeek.toISOString().split('T')[0];
  }

  // Türkçe ay isimleri
  const turkishMonths: Record<string, number> = {
    ocak: 0, şubat: 1, subat: 1, mart: 2, nisan: 3, mayıs: 4, mayis: 4,
    haziran: 5, temmuz: 6, ağustos: 7, agustos: 7, eylül: 8, eylul: 8,
    ekim: 9, kasım: 10, kasim: 10, aralık: 11, aralik: 11,
  };

  // "23 Şubat", "23 Şubat 2026"
  const turkishDateMatch = lower.match(
    /(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?/
  );

  if (turkishDateMatch) {
    const day = parseInt(turkishDateMatch[1]);
    const month = turkishMonths[turkishDateMatch[2]];
    const year = turkishDateMatch[3]
      ? parseInt(turkishDateMatch[3])
      : today.getFullYear();

    if (day >= 1 && day <= 31 && month !== undefined) {
      const d = new Date(year, month, day);
      return d.toISOString().split('T')[0];
    }
  }

  // dd/MM/yyyy veya dd.MM.yyyy
  const numericDateMatch = lower.match(
    /(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/
  );
  if (numericDateMatch) {
    const day = parseInt(numericDateMatch[1]);
    const month = parseInt(numericDateMatch[2]) - 1;
    let year = parseInt(numericDateMatch[3]);
    if (year < 100) year += 2000;

    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(year, month, day);
      return d.toISOString().split('T')[0];
    }
  }

  return null;
}

/**
 * Metinden tutar çıkarmaya çalışır (Türkçe formatlı)
 */
function parseAmount(text: string): number | null {
  // Tutar desenleri
  const patterns: RegExp[] = [
    // "450 TL", "450,50 TL", "1.250 TL", "1.250,50 TL"
    /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*(?:TL|tl|₺|lira)/,
    // "TL 450", "₺450", "₺ 450"
    /(?:TL|tl|₺)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/,
    // Sadece sayı (geri dönüş): "450" veya "1.250,50"
    /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[1];
      // Türk formatından çevir: noktalar binlik ayracı, virgül ondalık
      const cleaned = numStr.replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }

  return null;
}

/**
 * Metinden merchant (işyeri) adı çıkarmaya çalışır
 */
function extractMerchant(text: string): string {
  // Bilinen marka adlarını önce kontrol et
  const lower = text.toLowerCase();

  for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      // Tek kelimelik anahtar kelimeleri atla (çok genel)
      if (keyword.length < 3) continue;

      const idx = lower.indexOf(keyword);
      if (idx !== -1) {
        // Orijinal metindeki büyük/küçük harf durumunu koru
        return text.substring(idx, idx + keyword.length);
      }
    }
  }

  // Türkçe yer eki desenlerinden çıkar
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length >= 2) {
      return match[1];
    }
  }

  return '';
}

/**
 * Metin ve/veya merchant adından kategori tahmin eder
 */
function guessCategory(text: string, merchant: string): string {
  const searchText = `${text} ${merchant}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        return category;
      }
    }
  }

  return 'diger-gider';
}

// ============= ANA FONKSİYONLAR =============

/**
 * Doğal dilde yazılmış Türkçe harcama metnini analiz eder.
 * API anahtarı varsa Gemini AI kullanır, yoksa regex tabanlı çevrimdışı ayrıştırıcıya düşer.
 *
 * Örnekler:
 * - "Dün Migros'ta 450 TL market alışverişi"
 * - "250₺ yemek"
 * - "Bugün taksi 85 TL"
 *
 * @param text - Kullanıcının girdiği serbest metin
 * @param apiKey - Opsiyonel Gemini API anahtarı
 * @returns Ayrıştırılmış harcama bilgisi veya null
 */
export async function parseExpenseFromText(
  text: string,
  apiKey?: string
): Promise<ParsedExpense | null> {
  if (!text || text.trim().length === 0) return null;

  // API anahtarı varsa Gemini ile dene
  if (apiKey) {
    try {
      const result = await parseWithGemini(text, apiKey);
      if (result) return result;
    } catch {
      // Gemini başarısız olursa çevrimdışı ayrıştırıcıya düş
    }
  }

  // Çevrimdışı (regex) ayrıştırıcı
  return parseExpenseOffline(text);
}

/**
 * Regex tabanlı çevrimdışı harcama ayrıştırıcısı.
 * API gerektirmez, anında sonuç döner.
 *
 * @param text - Kullanıcının girdiği serbest metin
 * @returns Ayrıştırılmış harcama bilgisi veya null
 */
export function parseExpenseOffline(text: string): ParsedExpense | null {
  if (!text || text.trim().length === 0) return null;

  const amount = parseAmount(text);
  if (!amount) return null; // Tutar bulunamadıysa anlam yok

  const merchant = extractMerchant(text);
  const category = guessCategory(text, merchant);
  const date = parseTurkishDate(text) || new Date().toISOString().split('T')[0];

  // Güven skoru hesapla
  let confidence = 0.3; // Temel skor (tutar bulundu)

  if (merchant) confidence += 0.25;
  if (category !== 'diger-gider') confidence += 0.25;
  if (parseTurkishDate(text)) confidence += 0.2;

  return {
    amount,
    category,
    merchant: merchant || '',
    date,
    description: text.trim(),
    confidence: Math.min(confidence, 1),
  };
}

// ============= GEMİNİ ENTEGRASYONU =============

const EXPENSE_PARSE_PROMPT = `Sen bir Türk finansal metin ayrıştırıcısısın. Verilen serbest metni analiz et ve harcama bilgilerini JSON formatında döndür:

{
  "amount": <tutar, sayı olarak, örn: 450.50>,
  "category": "<kategori: market, kira, fatura, ulasim, saglik, egitim, eglence, giyim, yemek, ev, cocuk, evcil, bakim, hediye, tasit, sigorta, diger-gider>",
  "merchant": "<mağaza/işyeri adı, yoksa boş string>",
  "date": "<tarih, YYYY-MM-DD formatında. 'bugün', 'dün' gibi ifadeleri bugünün tarihine göre hesapla>",
  "description": "<orijinal metin>"
}

Kurallar:
- Türk para formatı: 1.234,56 (nokta binlik, virgül ondalık)
- "TL", "₺", "lira" para birimi göstergeleri
- "bugün" = günün tarihi, "dün" = bir gün önce
- Mağaza adını Türkçe eklerden çıkar (-da, -de, -ta, -te, 'da, 'de vb.)
- Kategoriyi mağaza ve bağlamdan tahmin et
- Sadece JSON döndür, başka metin ekleme`;

/**
 * Gemini API ile metin ayrıştırma (geminiReceiptScanner.ts ile aynı desen)
 */
async function parseWithGemini(
  text: string,
  apiKey: string
): Promise<ParsedExpense | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const today = new Date().toISOString().split('T')[0];

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${EXPENSE_PARSE_PROMPT}\n\nBugünün tarihi: ${today}\n\nMetin: "${text}"`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON çıkar (```json ... ``` sarmalı olabilir)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (typeof parsed.amount !== 'number' || parsed.amount <= 0) return null;

    return {
      amount: parsed.amount,
      category: parsed.category || 'diger-gider',
      merchant: parsed.merchant || '',
      date: parsed.date || today,
      description: parsed.description || text.trim(),
      confidence: 0.9, // AI ayrıştırması yüksek güven
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
