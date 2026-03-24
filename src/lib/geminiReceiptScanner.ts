import type { ParsedReceipt } from './receiptParser';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const STORAGE_KEY = 'kredi-pusula-gemini-api-key';

export function getGeminiApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setGeminiApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function removeGeminiApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey();
}

const RECEIPT_PROMPT = `Sen bir Türk fiş/fatura analiz uzmanısın. Verilen fiş görüntüsünü analiz et ve aşağıdaki bilgileri JSON formatında döndür:

{
  "total": <toplam tutar, sayı olarak, örn: 145.50>,
  "date": "<tarih, YYYY-MM-DD formatında, yoksa null>",
  "merchant": "<mağaza/işyeri adı, yoksa null>",
  "category": "<kategori: market, tasit, saglik, yemek, giyim, eglence, fatura, ulasim, ev veya null>",
  "vat": <KDV tutarı, sayı olarak, yoksa null>,
  "confidence": "<high, medium veya low>"
}

Kurallar:
- Türk fişlerinde tutar formatı: 1.234,56 (nokta binlik, virgül ondalık)
- TOPLAM, GENEL TOPLAM, TUTAR, NAKİT veya KART satırındaki tutarı al
- Mağaza adı genellikle fişin üst kısmındadır
- Kategoriyi mağaza adından ve ürünlerden tahmin et
- Sadece JSON döndür, başka metin ekleme`;

export async function scanReceiptWithGemini(base64Image: string): Promise<ParsedReceipt> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('GEMINI_NOT_CONFIGURED');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: RECEIPT_PROMPT },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response (may be wrapped in ```json ... ```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      total: typeof parsed.total === 'number' ? parsed.total : null,
      date: parsed.date || null,
      merchant: parsed.merchant || null,
      category: parsed.category || null,
      vat: typeof parsed.vat === 'number' ? parsed.vat : null,
      rawText: `[AI Analysis]\n${text}`,
      confidence: parsed.confidence || 'medium',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
