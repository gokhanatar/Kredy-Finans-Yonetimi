/**
 * Turkish receipt text parser
 * Extracts total amount, date, merchant name, VAT from OCR text
 */

export interface ParsedReceipt {
  total: number | null;
  date: string | null;
  merchant: string | null;
  category: string | null;
  vat: number | null;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

// Turkish number: "1.234,56" → 1234.56
function parseTurkishAmount(str: string): number | null {
  const cleaned = str.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Category keyword map
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  market: [
    'migros', 'bim', 'a101', 'şok', 'carrefour', 'metro', 'macro', 'file',
    'hakmar', 'onur', 'market', 'süpermarket', 'grocery', 'gıda',
  ],
  tasit: [
    'shell', 'opet', 'bp', 'petrol ofisi', 'total', 'turkuaz', 'go',
    'benzin', 'akaryakıt', 'otopark', 'parking',
  ],
  saglik: [
    'eczane', 'pharmacy', 'hastane', 'hospital', 'klinik', 'clinic',
    'medikal', 'medical', 'sağlık',
  ],
  yemek: [
    'restoran', 'restaurant', 'cafe', 'kahve', 'starbucks', 'mcdonalds',
    'burger king', 'kfc', 'dominos', 'pizza', 'yemeksepeti', 'getir',
    'trendyol yemek', 'lokanta',
  ],
  giyim: [
    'lc waikiki', 'h&m', 'zara', 'defacto', 'koton', 'mango', 'boyner',
    'vakko', 'mavi', 'colin', 'ipekyol', 'giyim', 'fashion',
  ],
  eglence: [
    'netflix', 'spotify', 'youtube', 'sinema', 'cinema', 'bilet',
    'ticket', 'konser', 'tiyatro', 'disney',
  ],
  fatura: [
    'türk telekom', 'vodafone', 'turkcell', 'elektrik', 'doğalgaz',
    'su idaresi', 'igdaş', 'enerjisa', 'başkent doğalgaz',
  ],
  ulasim: [
    'istanbulkart', 'ankarakart', 'metro', 'otobüs', 'taksi', 'uber',
    'bitaksi', 'thy', 'pegasus', 'anadolujet',
  ],
  ev: [
    'ikea', 'bauhaus', 'koçtaş', 'tekzen', 'praktiker', 'mobilya',
  ],
};

export function extractTotal(lines: string[]): number | null {
  const text = lines.join(' ');

  // Priority patterns for Turkish receipts
  const patterns = [
    // GENEL TOPLAM: 1.234,56
    /GENEL\s*TOPLAM[:\s]*\*?\s*([0-9.,]+)/i,
    // TOPLAM: 1.234,56
    /TOPLAM[:\s]*\*?\s*([0-9.,]+)/i,
    // TOTAL: 1.234,56
    /TOTAL[:\s]*\*?\s*([0-9.,]+)/i,
    // TUTAR: 1.234,56
    /TUTAR[:\s]*\*?\s*([0-9.,]+)/i,
    // NAKİT: 1.234,56
    /NAK[İI]T[:\s]*\*?\s*([0-9.,]+)/i,
    // KART: 1.234,56
    /KART[:\s]*\*?\s*([0-9.,]+)/i,
    // ÖDENDİ: 1.234,56
    /[ÖO]DEND[İI][:\s]*\*?\s*([0-9.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseTurkishAmount(match[1]);
      if (amount && amount > 0) return amount;
    }
  }

  // Fallback: last significant number on a line with * or TOPLAM-like keyword
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/toplam|total|tutar|öden|nakit|kart/i.test(line)) {
      const numMatch = line.match(/([0-9]+[.,][0-9]{2})/);
      if (numMatch) {
        const amount = parseTurkishAmount(numMatch[1]);
        if (amount && amount > 0) return amount;
      }
    }
  }

  return null;
}

export function extractDate(lines: string[]): string | null {
  const text = lines.join(' ');

  // dd/MM/yyyy or dd.MM.yyyy or dd-MM-yyyy
  const datePatterns = [
    /(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/,
    /(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      let year = parseInt(match[3]);
      if (year < 100) year += 2000;

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020) {
        const date = new Date(year, month - 1, day);
        return date.toISOString().split('T')[0];
      }
    }
  }

  return null;
}

export function extractMerchant(lines: string[]): string | null {
  // Merchant name is usually in the first few non-empty lines
  const candidates: string[] = [];
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    // Skip lines that are mostly numbers, dates, or very short
    if (line.length < 3) continue;
    if (/^\d+$/.test(line)) continue;
    if (/^tarih|^saat|^fis|^fiş|^\d{1,2}[/.\-]\d/i.test(line)) continue;
    // Skip lines with common header noise
    if (/^tel|^adres|^vergi|^tckn|^vkn/i.test(line)) continue;
    candidates.push(line);
  }

  if (candidates.length > 0) {
    // Return the first meaningful line (likely store name)
    return candidates[0].substring(0, 50);
  }

  return null;
}

export function extractVAT(lines: string[]): number | null {
  const text = lines.join(' ');
  const patterns = [
    /KDV[:\s]*\*?\s*([0-9.,]+)/i,
    /TOPKDV[:\s]*\*?\s*([0-9.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseTurkishAmount(match[1]);
    }
  }

  return null;
}

export function guessCategory(merchant: string | null): string | null {
  if (!merchant) return null;
  const lower = merchant.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

export function parseReceipt(rawText: string): ParsedReceipt {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  const total = extractTotal(lines);
  const date = extractDate(lines);
  const merchant = extractMerchant(lines);
  const vat = extractVAT(lines);
  const category = guessCategory(merchant);

  // Confidence based on how much we extracted
  let confidence: ParsedReceipt['confidence'] = 'low';
  if (total && merchant) confidence = 'high';
  else if (total || merchant) confidence = 'medium';

  return {
    total,
    date,
    merchant,
    category,
    vat,
    rawText,
    confidence,
  };
}
