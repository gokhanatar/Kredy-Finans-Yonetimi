// Yatırım Portföyü Tipleri

export type InvestmentCategory = 'altin' | 'gumus' | 'doviz' | 'hisse' | 'kripto';

export type StockExchange = 'bist' | 'us';

// Core gold types (used for API mapping)
export type GoldType =
  | 'gram_altin'
  | 'ceyrek_altin'
  | 'yarim_altin'
  | 'tam_altin'
  | 'cumhuriyet_altini'
  | 'ata_altin'
  | 'resat_altin'
  | '14_ayar'
  | '18_ayar'
  | '22_ayar'
  | '24_ayar';

export type SilverType = 'gram_gumus' | 'gumus_925' | 'platin' | 'paladyum' | 'bakir' | 'titanyum';

// ─── Gold Item Definitions (comprehensive) ──────────────────
export type GoldGroup = 'popular' | 'yatirim' | 'bilezik' | 'kolye' | 'yuzuk_kupe';

export interface GoldItemDef {
  id: string;
  label: string;
  group: GoldGroup;
  ayar: number;
  fixedGramPerPiece?: number;
  needsGramInput: boolean;
  icon: string;
}

export const GOLD_GROUP_LABELS: Record<GoldGroup, string> = {
  popular: 'En Popüler 10',
  yatirim: 'Yatırım & Sarrafiye',
  bilezik: 'Bilezikler',
  kolye: 'Kolyeler & Zincirler',
  yuzuk_kupe: 'Yüzükler & Küpeler',
};

export const GOLD_GROUP_ICONS: Record<GoldGroup, string> = {
  popular: '⭐',
  yatirim: '🏅',
  bilezik: '💍',
  kolye: '📿',
  yuzuk_kupe: '💎',
};

export const GOLD_ITEMS: GoldItemDef[] = [
  // ── EN POPÜLER 10 ─────────────────────────────────────────
  { id: 'gram_altin', label: 'Gram Altın (24 Ayar)', group: 'popular', ayar: 24, fixedGramPerPiece: 1, needsGramInput: false, icon: '🏅' },
  { id: 'ceyrek_altin', label: 'Çeyrek Altın', group: 'popular', ayar: 22, fixedGramPerPiece: 1.75, needsGramInput: false, icon: '🥇' },
  { id: 'cumhuriyet_altini', label: 'Cumhuriyet Altını (Ata Lira)', group: 'popular', ayar: 22, fixedGramPerPiece: 7.216, needsGramInput: false, icon: '🥇' },
  { id: 'ajda_bilezik', label: 'Ajda Bilezik (22 Ayar)', group: 'popular', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'adana_burma', label: 'Adana Burma (22 Ayar)', group: 'popular', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'tam_altin', label: 'Tam Altın (Ziynet Lira)', group: 'popular', ayar: 22, fixedGramPerPiece: 7.0, needsGramInput: false, icon: '🥇' },
  { id: 'yarim_altin', label: 'Yarım Altın', group: 'popular', ayar: 22, fixedGramPerPiece: 3.5, needsGramInput: false, icon: '🥇' },
  { id: 'kulce_altin', label: 'Külçe Altın (Sertifikalı)', group: 'popular', ayar: 24, needsGramInput: true, icon: '🏅' },
  { id: 'gremse_altin', label: 'Gremse Altın (2.5\'luk)', group: 'popular', ayar: 22, fixedGramPerPiece: 17.5, needsGramInput: false, icon: '🥇' },
  { id: 'kesme_altin', label: 'Kesme Altın (Hurda/Çekili)', group: 'popular', ayar: 24, needsGramInput: true, icon: '🏅' },

  // ── YATIRIM & SARRAFİYE ───────────────────────────────────
  { id: 'hamit_altin', label: 'Hamit Altın', group: 'yatirim', ayar: 22, fixedGramPerPiece: 7.216, needsGramInput: false, icon: '🥇' },
  { id: 'resat_altin', label: 'Reşat Altın', group: 'yatirim', ayar: 22, fixedGramPerPiece: 7.216, needsGramInput: false, icon: '🥇' },
  { id: 'ata_altin', label: 'Ata Altın', group: 'yatirim', ayar: 22, fixedGramPerPiece: 7.216, needsGramInput: false, icon: '🥇' },
  { id: '22_ayar', label: '22 Ayar Gram Altın', group: 'yatirim', ayar: 22, needsGramInput: true, icon: '🏅' },
  { id: '24_ayar', label: '24 Ayar (Has Altın)', group: 'yatirim', ayar: 24, needsGramInput: true, icon: '🏅' },
  { id: 'kulplu_ceyrek', label: 'Kulplu Çeyrek', group: 'yatirim', ayar: 22, fixedGramPerPiece: 2.0, needsGramInput: false, icon: '🥇' },
  { id: 'kulplu_resat', label: 'Kulplu Reşat', group: 'yatirim', ayar: 22, fixedGramPerPiece: 7.5, needsGramInput: false, icon: '🥇' },
  { id: 'besibiyerde', label: 'Beşibiyerde (Ata Beşli)', group: 'yatirim', ayar: 22, fixedGramPerPiece: 36.08, needsGramInput: false, icon: '🥇' },
  { id: '14_ayar', label: '14 Ayar (Gram)', group: 'yatirim', ayar: 14, needsGramInput: true, icon: '🏅' },
  { id: '18_ayar', label: '18 Ayar (Gram)', group: 'yatirim', ayar: 18, needsGramInput: true, icon: '🏅' },

  // ── BİLEZİKLER ────────────────────────────────────────────
  { id: 'trabzon_hasir', label: 'Trabzon Hasır Bilezik', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'ikili_burma', label: 'İkili Burma', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'uclu_burma', label: 'Üçlü Burma', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'halep_burma', label: 'Halep Burması', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'ankara_burma', label: 'Ankara Burması', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'kibrit_copu', label: 'Kibrit Çöpü (Ray) Bilezik', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'mega_bilezik', label: 'Mega Bilezik', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'kelepce_bilezik', label: 'Kelepçe Bilezik', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'dorika_bilezik', label: 'Dorika Bilezik (Top Top)', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'kaburga_bilezik', label: 'Kaburga Bilezik', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'baget_kelepce', label: 'Baget Taşlı Kelepçe', group: 'bilezik', ayar: 14, needsGramInput: true, icon: '💍' },
  { id: 'carnier_bilezik', label: 'Çarnier Bilezik', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },
  { id: 'hediyelik_bilezik', label: 'Hediyelik 8/14 Ayar Bilezik', group: 'bilezik', ayar: 14, needsGramInput: true, icon: '💍' },
  { id: 'frenk_bagi', label: 'Frenk Bağı', group: 'bilezik', ayar: 22, needsGramInput: true, icon: '💍' },

  // ── KOLYELER & ZİNCİRLER ──────────────────────────────────
  { id: 'tugrali_kolye', label: 'Tuğralı Kolye', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'cerceve_kolye', label: 'Çeyrekli/Yarımlı Çerçeve Kolye', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'halat_zincir', label: 'Halat Zincir', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'pullu_zincir', label: 'Pullu Zincir (Arpa Zincir)', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'samanyolu_kolye', label: 'Samanyolu Kolye', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'resatli_kolye', label: 'Reşatlı Kolye', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'yonca_kolye', label: 'Yonca Kolye (Van Cleef Tarzı)', group: 'kolye', ayar: 18, needsGramInput: true, icon: '📿' },
  { id: 'baliksiriti_zincir', label: 'Balıksırtı Zincir', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'singapur_zincir', label: 'Singapur Zincir', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'italyan_ezme', label: 'İtalyan Ezme Zincir', group: 'kolye', ayar: 22, needsGramInput: true, icon: '📿' },
  { id: 'isimli_kolye', label: 'İsimli Kolye', group: 'kolye', ayar: 14, needsGramInput: true, icon: '📿' },
  { id: 'nazar_kolye', label: 'Nazar Boncuklu Kolye', group: 'kolye', ayar: 14, needsGramInput: true, icon: '📿' },

  // ── YÜZÜKLER & KÜPELER ────────────────────────────────────
  { id: 'tektas_yuzuk', label: 'Tektaş Yüzük (Altın)', group: 'yuzuk_kupe', ayar: 14, needsGramInput: true, icon: '💎' },
  { id: 'bestas_yuzuk', label: 'Beştaş Yüzük', group: 'yuzuk_kupe', ayar: 14, needsGramInput: true, icon: '💎' },
  { id: 'klasik_alyans', label: 'Klasik Alyans', group: 'yuzuk_kupe', ayar: 22, needsGramInput: true, icon: '💎' },
  { id: 'halka_kupe', label: 'Halka Küpe', group: 'yuzuk_kupe', ayar: 22, needsGramInput: true, icon: '💎' },
  { id: 'top_kupe', label: 'Top Küpe', group: 'yuzuk_kupe', ayar: 22, needsGramInput: true, icon: '💎' },
];

// Helper to find a gold item by id
export function getGoldItem(id: string): GoldItemDef | undefined {
  return GOLD_ITEMS.find((item) => item.id === id);
}

// ─── Metal/Silver Item Definitions ──────────────────────────
export interface MetalItemDef {
  id: string;
  label: string;
  icon: string;
}

export const METAL_ITEMS: MetalItemDef[] = [
  { id: 'gram_gumus', label: 'Gram Gümüş (999)', icon: '🥈' },
  { id: 'gumus_925', label: '925 Ayar Gümüş (gram)', icon: '🥈' },
  { id: 'platin', label: 'Platin (gram)', icon: '🪙' },
  { id: 'paladyum', label: 'Paladyum (gram)', icon: '🔘' },
  { id: 'bakir', label: 'Bakır (gram)', icon: '🟠' },
  { id: 'titanyum', label: 'Titanyum (gram)', icon: '⚙️' },
];

export type CurrencyType = 'USD' | 'EUR' | 'GBP' | 'CHF' | 'JPY' | 'CAD' | 'AUD' | 'SAR';

export type InvestmentSubType = GoldType | SilverType | CurrencyType | string;

export interface Investment {
  id: string;
  category: InvestmentCategory;
  subType: InvestmentSubType;
  customName?: string;
  exchange?: StockExchange;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
}

export interface InvestmentPrice {
  type: string;
  buyPrice: number;
  sellPrice: number;
  lastUpdated: string;
}

export interface InvestmentPriceCache {
  gold: InvestmentPrice[];
  silver: InvestmentPrice[];
  currency: InvestmentPrice[];
  crypto: InvestmentPrice[];
  stocks: InvestmentPrice[];
  lastFetched: string;
}

// Labels

export const INVESTMENT_CATEGORY_LABEL_KEYS: Record<InvestmentCategory, string> = {
  altin: 'investments:categories.altin',
  gumus: 'investments:categories.gumus',
  doviz: 'investments:categories.doviz',
  hisse: 'investments:categories.hisse',
  kripto: 'investments:categories.kripto',
};

export const INVESTMENT_CATEGORY_EMOJIS: Record<InvestmentCategory, string> = {
  altin: '🥇',
  gumus: '🥈',
  doviz: '💵',
  hisse: '📈',
  kripto: '₿',
};

// Derived labels from GOLD_ITEMS
export const GOLD_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  GOLD_ITEMS.map((item) => [item.id, item.label])
);

// Derived labels from METAL_ITEMS
export const SILVER_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  METAL_ITEMS.map((item) => [item.id, item.label])
);

export const CURRENCY_TYPE_LABELS: Record<CurrencyType, string> = {
  USD: 'Amerikan Doları (USD)',
  EUR: 'Euro (EUR)',
  GBP: 'İngiliz Sterlini (GBP)',
  CHF: 'İsviçre Frangı (CHF)',
  JPY: 'Japon Yeni (JPY)',
  CAD: 'Kanada Doları (CAD)',
  AUD: 'Avustralya Doları (AUD)',
  SAR: 'Suudi Riyali (SAR)',
};

export const CURRENCY_FLAGS: Record<CurrencyType, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  CHF: '🇨🇭',
  JPY: '🇯🇵',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  SAR: '🇸🇦',
};

// Gold gram multipliers (derived from GOLD_ITEMS fixedGramPerPiece)
export const GOLD_GRAM_MULTIPLIERS: Record<string, number> = Object.fromEntries(
  GOLD_ITEMS.filter((i) => i.fixedGramPerPiece).map((i) => [i.id, i.fixedGramPerPiece!])
);

// Gold purity ratios (derived from GOLD_ITEMS ayar)
export const GOLD_PURITY_RATIOS: Record<string, number> = Object.fromEntries(
  GOLD_ITEMS.map((i) => [i.id, i.ayar / 24])
);

// ─── BIST Stocks ─────────────────────────────────────────────

export type BistSector = 'banka' | 'holding' | 'havacılık' | 'teknoloji' | 'enerji' | 'perakende' | 'sanayi' | 'madencilik' | 'gıda' | 'inşaat' | 'sağlık' | 'iletişim' | 'otomotiv' | 'kimya';

export interface StockInfo {
  symbol: string;
  name: string;
  sector: BistSector | UsSector;
}

export const BIST_SECTOR_LABELS: Record<BistSector, string> = {
  banka: 'Bankacılık',
  holding: 'Holding',
  'havacılık': 'Havacılık & Ulaşım',
  teknoloji: 'Teknoloji & Savunma',
  enerji: 'Enerji & Petrokimya',
  perakende: 'Perakende',
  sanayi: 'Sanayi',
  madencilik: 'Madencilik & Metal',
  'gıda': 'Gıda & İçecek',
  'inşaat': 'İnşaat & GYO',
  'sağlık': 'Sağlık',
  'iletişim': 'Telekomünikasyon',
  otomotiv: 'Otomotiv',
  kimya: 'Kimya & Çimento',
};

export const BIST_STOCKS: StockInfo[] = [
  // Bankacılık
  { symbol: 'GARAN', name: 'Garanti BBVA', sector: 'banka' },
  { symbol: 'AKBNK', name: 'Akbank', sector: 'banka' },
  { symbol: 'ISCTR', name: 'İş Bankası', sector: 'banka' },
  { symbol: 'YKBNK', name: 'Yapı Kredi', sector: 'banka' },
  { symbol: 'HALKB', name: 'Halkbank', sector: 'banka' },
  { symbol: 'VAKBN', name: 'Vakıfbank', sector: 'banka' },
  { symbol: 'TSKB', name: 'TSKB', sector: 'banka' },
  { symbol: 'QNBFB', name: 'QNB Finansbank', sector: 'banka' },
  { symbol: 'ALBRK', name: 'Albaraka Türk', sector: 'banka' },
  { symbol: 'SKBNK', name: 'Şekerbank', sector: 'banka' },
  // Holding
  { symbol: 'KCHOL', name: 'Koç Holding', sector: 'holding' },
  { symbol: 'SAHOL', name: 'Sabancı Holding', sector: 'holding' },
  { symbol: 'TAVHL', name: 'TAV Havalimanları', sector: 'holding' },
  { symbol: 'AGHOL', name: 'AG Anadolu Grubu', sector: 'holding' },
  { symbol: 'DOHOL', name: 'Doğan Holding', sector: 'holding' },
  { symbol: 'SISE', name: 'Şişecam', sector: 'holding' },
  { symbol: 'GLYHO', name: 'Global Yatırım Holding', sector: 'holding' },
  { symbol: 'NUHCM', name: 'Nuh Çimento', sector: 'holding' },
  { symbol: 'CIMSA', name: 'Çimsa Çimento', sector: 'holding' },
  // Havacılık & Ulaşım
  { symbol: 'THYAO', name: 'Türk Hava Yolları', sector: 'havacılık' },
  { symbol: 'PGSUS', name: 'Pegasus', sector: 'havacılık' },
  { symbol: 'TOASO', name: 'Tofaş Oto', sector: 'havacılık' },
  { symbol: 'FROTO', name: 'Ford Otosan', sector: 'havacılık' },
  { symbol: 'DOAS', name: 'Doğuş Otomotiv', sector: 'havacılık' },
  { symbol: 'TTRAK', name: 'Türk Traktör', sector: 'havacılık' },
  // Teknoloji & Savunma
  { symbol: 'ASELS', name: 'ASELSAN', sector: 'teknoloji' },
  { symbol: 'TCELL', name: 'Turkcell', sector: 'teknoloji' },
  { symbol: 'LOGO', name: 'Logo Yazılım', sector: 'teknoloji' },
  { symbol: 'NETAS', name: 'Netaş Telekomünikasyon', sector: 'teknoloji' },
  { symbol: 'ARDYZ', name: 'Ardelis Teknoloji', sector: 'teknoloji' },
  { symbol: 'INDES', name: 'İndeks Bilgisayar', sector: 'teknoloji' },
  { symbol: 'PAPIL', name: 'Papilon Savunma', sector: 'teknoloji' },
  { symbol: 'KAREL', name: 'Karel Elektronik', sector: 'teknoloji' },
  { symbol: 'MIATK', name: 'Mia Teknoloji', sector: 'teknoloji' },
  { symbol: 'ALCTL', name: 'Alcatel Lucent Teletaş', sector: 'teknoloji' },
  // Enerji & Petrokimya
  { symbol: 'TUPRS', name: 'Tüpraş', sector: 'enerji' },
  { symbol: 'PETKM', name: 'Petkim', sector: 'enerji' },
  { symbol: 'EREGL', name: 'Ereğli Demir Çelik', sector: 'enerji' },
  { symbol: 'KRDMD', name: 'Kardemir', sector: 'enerji' },
  { symbol: 'AYEN', name: 'Aydem Enerji', sector: 'enerji' },
  { symbol: 'AKSEN', name: 'Aksa Enerji', sector: 'enerji' },
  { symbol: 'ODAS', name: 'Odaş Enerji', sector: 'enerji' },
  { symbol: 'ZOREN', name: 'Zorlu Enerji', sector: 'enerji' },
  { symbol: 'GESAN', name: 'Giresun Sanayi', sector: 'enerji' },
  // Perakende
  { symbol: 'BIMAS', name: 'BİM Mağazaları', sector: 'perakende' },
  { symbol: 'MGROS', name: 'Migros', sector: 'perakende' },
  { symbol: 'SOKM', name: 'Şok Marketler', sector: 'perakende' },
  { symbol: 'BIZIM', name: 'Bizim Mağazaları', sector: 'perakende' },
  { symbol: 'ADESE', name: 'Adese AVM', sector: 'perakende' },
  { symbol: 'MAVI', name: 'Mavi Giyim', sector: 'perakende' },
  { symbol: 'VAKKO', name: 'Vakko Tekstil', sector: 'perakende' },
  { symbol: 'BOYP', name: 'Boyner Perakende', sector: 'perakende' },
  // Sanayi
  { symbol: 'ARCLK', name: 'Arçelik', sector: 'sanayi' },
  { symbol: 'VESTL', name: 'Vestel Elektronik', sector: 'sanayi' },
  { symbol: 'BRISA', name: 'Brisa Bridgestone', sector: 'sanayi' },
  { symbol: 'SASA', name: 'SASA Polyester', sector: 'sanayi' },
  { symbol: 'HEKTS', name: 'Hektaş', sector: 'sanayi' },
  { symbol: 'KLMSN', name: 'Klimasan', sector: 'sanayi' },
  { symbol: 'CEMAS', name: 'Çemaş Döküm', sector: 'sanayi' },
  { symbol: 'ADEL', name: 'Adel Kalemcilik', sector: 'sanayi' },
  { symbol: 'DEVA', name: 'Deva Holding', sector: 'sanayi' },
  { symbol: 'OTKAR', name: 'Otokar', sector: 'sanayi' },
  { symbol: 'KORDS', name: 'Kordsa', sector: 'sanayi' },
  { symbol: 'VESBE', name: 'Vestel Beyaz Eşya', sector: 'sanayi' },
  // Madencilik & Metal
  { symbol: 'KOZAL', name: 'Koza Altın', sector: 'madencilik' },
  { symbol: 'KOZAA', name: 'Koza Anadolu', sector: 'madencilik' },
  { symbol: 'IPEKE', name: 'İpek Enerji', sector: 'madencilik' },
  // Gıda & İçecek
  { symbol: 'ULKER', name: 'Ülker Bisküvi', sector: 'gıda' },
  { symbol: 'TATGD', name: 'Tat Gıda', sector: 'gıda' },
  { symbol: 'BANVT', name: 'Banvit', sector: 'gıda' },
  { symbol: 'CCOLA', name: 'Coca-Cola İçecek', sector: 'gıda' },
  { symbol: 'AEFES', name: 'Anadolu Efes', sector: 'gıda' },
  { symbol: 'KERVT', name: 'Kerevitaş', sector: 'gıda' },
  { symbol: 'PNSUT', name: 'Pınar Süt', sector: 'gıda' },
  { symbol: 'PINSU', name: 'Pınar Su', sector: 'gıda' },
  { symbol: 'ULUUN', name: 'Ulusoy Un', sector: 'gıda' },
  { symbol: 'KNFRT', name: 'Konfrut', sector: 'gıda' },
  // İnşaat & GYO
  { symbol: 'ENKAI', name: 'Enka İnşaat', sector: 'inşaat' },
  { symbol: 'EKGYO', name: 'Emlak Konut GYO', sector: 'inşaat' },
  { symbol: 'ISGYO', name: 'İş GYO', sector: 'inşaat' },
  { symbol: 'PEKGY', name: 'Peker GYO', sector: 'inşaat' },
  { symbol: 'TRGYO', name: 'Torunlar GYO', sector: 'inşaat' },
  { symbol: 'HLGYO', name: 'Halk GYO', sector: 'inşaat' },
  { symbol: 'RYGYO', name: 'Reysaş GYO', sector: 'inşaat' },
  { symbol: 'AKFGY', name: 'Akfen GYO', sector: 'inşaat' },
  { symbol: 'SNGYO', name: 'Sinpaş GYO', sector: 'inşaat' },
  // Sağlık
  { symbol: 'SELEC', name: 'Selçuk Ecza', sector: 'sağlık' },
  { symbol: 'MPARK', name: 'MLP Sağlık', sector: 'sağlık' },
  { symbol: 'DGNMO', name: 'Doğanlar Mobilya', sector: 'sağlık' },
  // Telekomünikasyon
  { symbol: 'TTKOM', name: 'Türk Telekom', sector: 'iletişim' },
  { symbol: 'NTHOL', name: 'Net Holding', sector: 'iletişim' },
  { symbol: 'ALTNY', name: 'Altınyunus Çeşme', sector: 'iletişim' },
  // Otomotiv
  { symbol: 'ASUZU', name: 'Anadolu Isuzu', sector: 'otomotiv' },
  { symbol: 'EGEEN', name: 'Ege Endüstri', sector: 'otomotiv' },
  // Kimya & Çimento
  { symbol: 'ALKIM', name: 'Alkim Kimya', sector: 'kimya' },
  { symbol: 'BUCIM', name: 'Bursa Çimento', sector: 'kimya' },
  { symbol: 'AKCNS', name: 'Akçansa', sector: 'kimya' },
  { symbol: 'GOLTS', name: 'Göltaş Çimento', sector: 'kimya' },
];

export const POPULAR_BIST_STOCKS = BIST_STOCKS.map((s) => s.symbol);

export const BIST_STOCK_LABELS: Record<string, string> = Object.fromEntries(
  BIST_STOCKS.map((s) => [s.symbol, s.name])
);

// ─── US Stocks ───────────────────────────────────────────────

export type UsSector = 'tech' | 'ecommerce' | 'finance' | 'health' | 'energy' | 'defense' | 'telecom' | 'auto' | 'entertainment' | 'industrial' | 'semi';

export const US_SECTOR_LABELS: Record<UsSector, string> = {
  tech: 'Teknoloji',
  ecommerce: 'E-Ticaret & Tüketici',
  finance: 'Finans',
  health: 'Sağlık & İlaç',
  energy: 'Enerji',
  defense: 'Havacılık & Savunma',
  telecom: 'Telekomünikasyon',
  auto: 'Otomotiv',
  entertainment: 'Eğlence & Medya',
  industrial: 'Endüstri',
  semi: 'Yarı İletken',
};

export const US_STOCKS: StockInfo[] = [
  // Teknoloji
  { symbol: 'AAPL', name: 'Apple', sector: 'tech' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'tech' },
  { symbol: 'GOOGL', name: 'Alphabet (Google)', sector: 'tech' },
  { symbol: 'NVDA', name: 'Nvidia', sector: 'tech' },
  { symbol: 'AMD', name: 'AMD', sector: 'tech' },
  { symbol: 'INTC', name: 'Intel', sector: 'tech' },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'tech' },
  { symbol: 'CRM', name: 'Salesforce', sector: 'tech' },
  { symbol: 'ORCL', name: 'Oracle', sector: 'tech' },
  { symbol: 'ADBE', name: 'Adobe', sector: 'tech' },
  { symbol: 'CSCO', name: 'Cisco', sector: 'tech' },
  { symbol: 'IBM', name: 'IBM', sector: 'tech' },
  { symbol: 'QCOM', name: 'Qualcomm', sector: 'tech' },
  { symbol: 'TSM', name: 'TSMC', sector: 'tech' },
  { symbol: 'UBER', name: 'Uber', sector: 'tech' },
  { symbol: 'SHOP', name: 'Shopify', sector: 'tech' },
  { symbol: 'SQ', name: 'Block (Square)', sector: 'tech' },
  { symbol: 'PLTR', name: 'Palantir', sector: 'tech' },
  { symbol: 'SNOW', name: 'Snowflake', sector: 'tech' },
  { symbol: 'NET', name: 'Cloudflare', sector: 'tech' },
  { symbol: 'CRWD', name: 'CrowdStrike', sector: 'tech' },
  { symbol: 'ZS', name: 'Zscaler', sector: 'tech' },
  { symbol: 'DDOG', name: 'Datadog', sector: 'tech' },
  { symbol: 'MDB', name: 'MongoDB', sector: 'tech' },
  { symbol: 'COIN', name: 'Coinbase', sector: 'tech' },
  { symbol: 'RBLX', name: 'Roblox', sector: 'tech' },
  { symbol: 'U', name: 'Unity', sector: 'tech' },
  { symbol: 'PINS', name: 'Pinterest', sector: 'tech' },
  { symbol: 'SNAP', name: 'Snap', sector: 'tech' },
  { symbol: 'TTD', name: 'The Trade Desk', sector: 'tech' },
  { symbol: 'TWLO', name: 'Twilio', sector: 'tech' },
  { symbol: 'OKTA', name: 'Okta', sector: 'tech' },
  { symbol: 'PANW', name: 'Palo Alto Networks', sector: 'tech' },
  { symbol: 'FTNT', name: 'Fortinet', sector: 'tech' },
  { symbol: 'SMCI', name: 'Super Micro Computer', sector: 'tech' },
  { symbol: 'ARM', name: 'ARM Holdings', sector: 'tech' },
  { symbol: 'MRVL', name: 'Marvell', sector: 'tech' },
  // E-Ticaret & Tüketici
  { symbol: 'AMZN', name: 'Amazon', sector: 'ecommerce' },
  { symbol: 'WMT', name: 'Walmart', sector: 'ecommerce' },
  { symbol: 'COST', name: 'Costco', sector: 'ecommerce' },
  { symbol: 'NKE', name: 'Nike', sector: 'ecommerce' },
  { symbol: 'SBUX', name: 'Starbucks', sector: 'ecommerce' },
  { symbol: 'MCD', name: 'McDonald\'s', sector: 'ecommerce' },
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'ecommerce' },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'ecommerce' },
  { symbol: 'PEP', name: 'PepsiCo', sector: 'ecommerce' },
  { symbol: 'TGT', name: 'Target', sector: 'ecommerce' },
  { symbol: 'HD', name: 'Home Depot', sector: 'ecommerce' },
  { symbol: 'LOW', name: 'Lowe\'s', sector: 'ecommerce' },
  { symbol: 'LULU', name: 'Lululemon', sector: 'ecommerce' },
  { symbol: 'ABNB', name: 'Airbnb', sector: 'ecommerce' },
  { symbol: 'BKNG', name: 'Booking Holdings', sector: 'ecommerce' },
  { symbol: 'DASH', name: 'DoorDash', sector: 'ecommerce' },
  // Finans
  { symbol: 'JPM', name: 'JP Morgan', sector: 'finance' },
  { symbol: 'BAC', name: 'Bank of America', sector: 'finance' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'finance' },
  { symbol: 'V', name: 'Visa', sector: 'finance' },
  { symbol: 'MA', name: 'Mastercard', sector: 'finance' },
  { symbol: 'PYPL', name: 'PayPal', sector: 'finance' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway', sector: 'finance' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'finance' },
  { symbol: 'C', name: 'Citigroup', sector: 'finance' },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'finance' },
  { symbol: 'AXP', name: 'American Express', sector: 'finance' },
  { symbol: 'SCHW', name: 'Charles Schwab', sector: 'finance' },
  { symbol: 'BLK', name: 'BlackRock', sector: 'finance' },
  { symbol: 'ICE', name: 'Intercontinental Exchange', sector: 'finance' },
  { symbol: 'CME', name: 'CME Group', sector: 'finance' },
  // Sağlık & İlaç
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'health' },
  { symbol: 'PFE', name: 'Pfizer', sector: 'health' },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'health' },
  { symbol: 'ABBV', name: 'AbbVie', sector: 'health' },
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'health' },
  { symbol: 'MRK', name: 'Merck', sector: 'health' },
  { symbol: 'NVO', name: 'Novo Nordisk', sector: 'health' },
  { symbol: 'TMO', name: 'Thermo Fisher', sector: 'health' },
  { symbol: 'ISRG', name: 'Intuitive Surgical', sector: 'health' },
  { symbol: 'DXCM', name: 'DexCom', sector: 'health' },
  { symbol: 'REGN', name: 'Regeneron', sector: 'health' },
  { symbol: 'AMGN', name: 'Amgen', sector: 'health' },
  { symbol: 'GILD', name: 'Gilead Sciences', sector: 'health' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb', sector: 'health' },
  { symbol: 'ZTS', name: 'Zoetis', sector: 'health' },
  { symbol: 'VRTX', name: 'Vertex Pharmaceuticals', sector: 'health' },
  // Enerji
  { symbol: 'XOM', name: 'ExxonMobil', sector: 'energy' },
  { symbol: 'CVX', name: 'Chevron', sector: 'energy' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'energy' },
  { symbol: 'SLB', name: 'Schlumberger', sector: 'energy' },
  { symbol: 'EOG', name: 'EOG Resources', sector: 'energy' },
  { symbol: 'OXY', name: 'Occidental Petroleum', sector: 'energy' },
  // Havacılık & Savunma
  { symbol: 'BA', name: 'Boeing', sector: 'defense' },
  { symbol: 'LMT', name: 'Lockheed Martin', sector: 'defense' },
  { symbol: 'RTX', name: 'RTX (Raytheon)', sector: 'defense' },
  // Otomotiv
  { symbol: 'TSLA', name: 'Tesla', sector: 'auto' },
  { symbol: 'F', name: 'Ford', sector: 'auto' },
  { symbol: 'GM', name: 'General Motors', sector: 'auto' },
  { symbol: 'TM', name: 'Toyota', sector: 'auto' },
  // Eğlence & Medya
  { symbol: 'NFLX', name: 'Netflix', sector: 'entertainment' },
  { symbol: 'DIS', name: 'Disney', sector: 'entertainment' },
  { symbol: 'META', name: 'Meta (Facebook)', sector: 'entertainment' },
  { symbol: 'SPOT', name: 'Spotify', sector: 'entertainment' },
  // Telekomünikasyon
  { symbol: 'T', name: 'AT&T', sector: 'telecom' },
  { symbol: 'VZ', name: 'Verizon', sector: 'telecom' },
  // Endüstri
  { symbol: 'CAT', name: 'Caterpillar', sector: 'industrial' },
  { symbol: 'DE', name: 'John Deere', sector: 'industrial' },
  { symbol: 'GE', name: 'General Electric', sector: 'industrial' },
  { symbol: 'HON', name: 'Honeywell', sector: 'industrial' },
  { symbol: 'UPS', name: 'United Parcel Service', sector: 'industrial' },
  { symbol: 'FDX', name: 'FedEx', sector: 'industrial' },
  { symbol: 'MMM', name: '3M', sector: 'industrial' },
  { symbol: 'EMR', name: 'Emerson Electric', sector: 'industrial' },
  // Yarı İletken
  { symbol: 'ASML', name: 'ASML Holding', sector: 'semi' },
  { symbol: 'LRCX', name: 'Lam Research', sector: 'semi' },
  { symbol: 'AMAT', name: 'Applied Materials', sector: 'semi' },
  { symbol: 'KLAC', name: 'KLA Corp', sector: 'semi' },
  { symbol: 'MU', name: 'Micron Technology', sector: 'semi' },
];

export const POPULAR_US_STOCKS = US_STOCKS.map((s) => s.symbol);

export const US_STOCK_LABELS: Record<string, string> = Object.fromEntries(
  US_STOCKS.map((s) => [s.symbol, s.name])
);

// ─── Crypto ──────────────────────────────────────────────────

export const POPULAR_CRYPTOS = [
  'Bitcoin (BTC)', 'Ethereum (ETH)', 'BNB', 'Solana (SOL)',
  'XRP', 'Cardano (ADA)', 'Avalanche (AVAX)', 'Dogecoin (DOGE)',
  'Polkadot (DOT)', 'Toncoin (TON)',
  'Polygon (MATIC)', 'Chainlink (LINK)', 'Uniswap (UNI)', 'Shiba Inu (SHIB)',
  'Litecoin (LTC)', 'Cosmos (ATOM)', 'Filecoin (FIL)', 'Aptos (APT)',
  'NEAR Protocol (NEAR)', 'Internet Computer (ICP)',
  'Aave (AAVE)', 'Optimism (OP)', 'Arbitrum (ARB)', 'Sui (SUI)',
  'Pepe (PEPE)', 'Render (RENDER)', 'Fetch.ai (FET)', 'Injective (INJ)',
  'Celestia (TIA)', 'Sei (SEI)',
  'Stacks (STX)', 'Algorand (ALGO)', 'Hedera (HBAR)', 'VeChain (VET)',
  'Decentraland (MANA)', 'The Sandbox (SAND)', 'Axie Infinity (AXS)', 'Gala (GALA)',
  'Cronos (CRO)', 'MultiversX (EGLD)',
  'Floki (FLOKI)', 'dogwifhat (WIF)', 'Bonk (BONK)', 'Jupiter (JUP)',
  'Worldcoin (WLD)', 'Ondo Finance (ONDO)', 'Ethena (ENA)', 'Pyth Network (PYTH)',
  'Kaspa (KAS)', 'TRON (TRX)',
];

export const CRYPTO_COINGECKO_MAP: Record<string, string> = {
  'Bitcoin (BTC)': 'bitcoin',
  'Ethereum (ETH)': 'ethereum',
  'BNB': 'binancecoin',
  'Solana (SOL)': 'solana',
  'XRP': 'ripple',
  'Cardano (ADA)': 'cardano',
  'Avalanche (AVAX)': 'avalanche-2',
  'Dogecoin (DOGE)': 'dogecoin',
  'Polkadot (DOT)': 'polkadot',
  'Toncoin (TON)': 'the-open-network',
  'Polygon (MATIC)': 'matic-network',
  'Chainlink (LINK)': 'chainlink',
  'Uniswap (UNI)': 'uniswap',
  'Shiba Inu (SHIB)': 'shiba-inu',
  'Litecoin (LTC)': 'litecoin',
  'Cosmos (ATOM)': 'cosmos',
  'Filecoin (FIL)': 'filecoin',
  'Aptos (APT)': 'aptos',
  'NEAR Protocol (NEAR)': 'near',
  'Internet Computer (ICP)': 'internet-computer',
  'Aave (AAVE)': 'aave',
  'Optimism (OP)': 'optimism',
  'Arbitrum (ARB)': 'arbitrum',
  'Sui (SUI)': 'sui',
  'Pepe (PEPE)': 'pepe',
  'Render (RENDER)': 'render-token',
  'Fetch.ai (FET)': 'fetch-ai',
  'Injective (INJ)': 'injective-protocol',
  'Celestia (TIA)': 'celestia',
  'Sei (SEI)': 'sei-network',
  'Stacks (STX)': 'blockstack',
  'Algorand (ALGO)': 'algorand',
  'Hedera (HBAR)': 'hedera-hashgraph',
  'VeChain (VET)': 'vechain',
  'Decentraland (MANA)': 'decentraland',
  'The Sandbox (SAND)': 'the-sandbox',
  'Axie Infinity (AXS)': 'axie-infinity',
  'Gala (GALA)': 'gala',
  'Cronos (CRO)': 'crypto-com-chain',
  'MultiversX (EGLD)': 'elrond-erd-2',
  'Floki (FLOKI)': 'floki',
  'dogwifhat (WIF)': 'dogwifcoin',
  'Bonk (BONK)': 'bonk',
  'Jupiter (JUP)': 'jupiter-exchange-solana',
  'Worldcoin (WLD)': 'worldcoin-wld',
  'Ondo Finance (ONDO)': 'ondo-finance',
  'Ethena (ENA)': 'ethena',
  'Pyth Network (PYTH)': 'pyth-network',
  'Kaspa (KAS)': 'kaspa',
  'TRON (TRX)': 'tron',
};

export const COINGECKO_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(CRYPTO_COINGECKO_MAP).map(([name, id]) => [id, name])
);

export const CRYPTO_INFO: Record<string, { symbol: string; color: string }> = {
  'Bitcoin (BTC)': { symbol: '₿', color: '#F7931A' },
  'Ethereum (ETH)': { symbol: 'Ξ', color: '#627EEA' },
  'BNB': { symbol: '◆', color: '#F3BA2F' },
  'Solana (SOL)': { symbol: '◎', color: '#9945FF' },
  'XRP': { symbol: '✕', color: '#23292F' },
  'Cardano (ADA)': { symbol: '♠', color: '#0033AD' },
  'Avalanche (AVAX)': { symbol: '△', color: '#E84142' },
  'Dogecoin (DOGE)': { symbol: 'D', color: '#C2A633' },
  'Polkadot (DOT)': { symbol: '●', color: '#E6007A' },
  'Toncoin (TON)': { symbol: '◇', color: '#0098EA' },
  'Polygon (MATIC)': { symbol: 'M', color: '#8247E5' },
  'Chainlink (LINK)': { symbol: '⬡', color: '#2A5ADA' },
  'Uniswap (UNI)': { symbol: 'U', color: '#FF007A' },
  'Shiba Inu (SHIB)': { symbol: 'S', color: '#FFA409' },
  'Litecoin (LTC)': { symbol: 'L', color: '#345D9D' },
  'Cosmos (ATOM)': { symbol: '⚛', color: '#2E3148' },
  'Filecoin (FIL)': { symbol: 'F', color: '#0090FF' },
  'Aptos (APT)': { symbol: 'A', color: '#4CD2BE' },
  'NEAR Protocol (NEAR)': { symbol: 'N', color: '#000000' },
  'Internet Computer (ICP)': { symbol: '∞', color: '#29ABE2' },
  'Aave (AAVE)': { symbol: 'A', color: '#B6509E' },
  'Optimism (OP)': { symbol: 'O', color: '#FF0420' },
  'Arbitrum (ARB)': { symbol: 'A', color: '#28A0F0' },
  'Sui (SUI)': { symbol: 'S', color: '#4DA2FF' },
  'Pepe (PEPE)': { symbol: 'P', color: '#4B8A08' },
  'Render (RENDER)': { symbol: 'R', color: '#000000' },
  'Fetch.ai (FET)': { symbol: 'F', color: '#1B1464' },
  'Injective (INJ)': { symbol: 'I', color: '#00F2FE' },
  'Celestia (TIA)': { symbol: 'T', color: '#7C3AED' },
  'Sei (SEI)': { symbol: 'S', color: '#9B1C1C' },
  'Stacks (STX)': { symbol: 'S', color: '#5546FF' },
  'Algorand (ALGO)': { symbol: 'A', color: '#000000' },
  'Hedera (HBAR)': { symbol: 'H', color: '#000000' },
  'VeChain (VET)': { symbol: 'V', color: '#15BDFF' },
  'Decentraland (MANA)': { symbol: 'M', color: '#FF2D55' },
  'The Sandbox (SAND)': { symbol: 'S', color: '#04ADEF' },
  'Axie Infinity (AXS)': { symbol: 'A', color: '#0055D5' },
  'Gala (GALA)': { symbol: 'G', color: '#000000' },
  'Cronos (CRO)': { symbol: 'C', color: '#002D74' },
  'MultiversX (EGLD)': { symbol: 'X', color: '#000000' },
  'Floki (FLOKI)': { symbol: 'F', color: '#FF9D00' },
  'dogwifhat (WIF)': { symbol: 'W', color: '#B88746' },
  'Bonk (BONK)': { symbol: 'B', color: '#F8A41B' },
  'Jupiter (JUP)': { symbol: 'J', color: '#9945FF' },
  'Worldcoin (WLD)': { symbol: 'W', color: '#000000' },
  'Ondo Finance (ONDO)': { symbol: 'O', color: '#1A73E8' },
  'Ethena (ENA)': { symbol: 'E', color: '#000000' },
  'Pyth Network (PYTH)': { symbol: 'P', color: '#6B5CE7' },
  'Kaspa (KAS)': { symbol: 'K', color: '#49DAA5' },
  'TRON (TRX)': { symbol: 'T', color: '#FF0013' },
};

// ─── Storage ─────────────────────────────────────────────────

export const INVESTMENT_STORAGE_KEYS = {
  INVESTMENTS: 'kredi-pusula-investments',
  INVESTMENT_PRICES: 'kredi-pusula-investment-prices',
} as const;

// ─── Default Fallback Prices ─────────────────────────────────

export const DEFAULT_GOLD_PRICES: InvestmentPrice[] = [
  { type: 'gram_altin', buyPrice: 3250, sellPrice: 3220, lastUpdated: '' },
  { type: 'ceyrek_altin', buyPrice: 5300, sellPrice: 5250, lastUpdated: '' },
  { type: 'yarim_altin', buyPrice: 10600, sellPrice: 10500, lastUpdated: '' },
  { type: 'tam_altin', buyPrice: 21100, sellPrice: 20900, lastUpdated: '' },
  { type: 'cumhuriyet_altini', buyPrice: 22000, sellPrice: 21700, lastUpdated: '' },
  { type: 'ata_altin', buyPrice: 22200, sellPrice: 21900, lastUpdated: '' },
  { type: 'resat_altin', buyPrice: 24000, sellPrice: 23500, lastUpdated: '' },
  { type: '14_ayar', buyPrice: 1920, sellPrice: 1880, lastUpdated: '' },
  { type: '18_ayar', buyPrice: 2440, sellPrice: 2400, lastUpdated: '' },
  { type: '22_ayar', buyPrice: 2980, sellPrice: 2940, lastUpdated: '' },
  { type: '24_ayar', buyPrice: 3250, sellPrice: 3220, lastUpdated: '' },
];

export const DEFAULT_SILVER_PRICES: InvestmentPrice[] = [
  { type: 'gram_gumus', buyPrice: 38, sellPrice: 36, lastUpdated: '' },
  { type: 'gumus_925', buyPrice: 35, sellPrice: 33, lastUpdated: '' },
  { type: 'platin', buyPrice: 1050, sellPrice: 1020, lastUpdated: '' },
  { type: 'paladyum', buyPrice: 1020, sellPrice: 990, lastUpdated: '' },
  { type: 'bakir', buyPrice: 0.32, sellPrice: 0.30, lastUpdated: '' },
  { type: 'titanyum', buyPrice: 1.20, sellPrice: 1.10, lastUpdated: '' },
];

export const DEFAULT_CURRENCY_PRICES: InvestmentPrice[] = [
  { type: 'USD', buyPrice: 36.50, sellPrice: 36.30, lastUpdated: '' },
  { type: 'EUR', buyPrice: 38.20, sellPrice: 38.00, lastUpdated: '' },
  { type: 'GBP', buyPrice: 45.80, sellPrice: 45.50, lastUpdated: '' },
  { type: 'CHF', buyPrice: 40.50, sellPrice: 40.20, lastUpdated: '' },
  { type: 'JPY', buyPrice: 0.24, sellPrice: 0.235, lastUpdated: '' },
  { type: 'CAD', buyPrice: 25.50, sellPrice: 25.30, lastUpdated: '' },
  { type: 'AUD', buyPrice: 23.20, sellPrice: 23.00, lastUpdated: '' },
  { type: 'SAR', buyPrice: 9.75, sellPrice: 9.65, lastUpdated: '' },
];

// ─── Helpers ─────────────────────────────────────────────────

export function getInvestmentLabel(category: InvestmentCategory, subType: InvestmentSubType, customName?: string): string {
  if (customName) return customName;
  if (category === 'altin') {
    const goldLabel = GOLD_TYPE_LABELS[subType];
    if (goldLabel) return goldLabel;
  }
  if (category === 'gumus') {
    const silverLabel = SILVER_TYPE_LABELS[subType];
    if (silverLabel) return silverLabel;
  }
  if (category === 'doviz' && subType in CURRENCY_TYPE_LABELS) return CURRENCY_TYPE_LABELS[subType as CurrencyType];
  if (category === 'hisse') {
    const bistLabel = BIST_STOCK_LABELS[subType];
    if (bistLabel) return `${subType} - ${bistLabel}`;
    const usLabel = US_STOCK_LABELS[subType];
    if (usLabel) return `${subType} - ${usLabel}`;
  }
  return subType;
}
