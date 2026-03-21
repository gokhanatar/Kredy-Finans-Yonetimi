
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214
215
2161x
 
1x
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
1x
 
1x
1x
1x
1x
1x
1x
1x
 
1x
1x
 
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
 
1x
1x
 
1x
1x
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
 
1x
1x
 
1x
1x
1x
 
1x
 
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
1x
1x
 // Asset types for property, vehicle, and business tracking
 
// ============= Gayrimenkul (Property) Types =============
 
export interface Property {
  id: string;
  name: string;                              // "Kadıköy Daire", "Ofis"
  type: 'konut' | 'isyeri' | 'arsa';
  location: 'buyuksehir' | 'diger';
  valuePreviousYear: number;                 // 2025 vergi değeri
  currentValue: number;                      // 2026 vergi değeri (otomatik hesaplanan)
  sqMeters?: number;                         // Metrekare (muafiyet kontrolü için)
  city?: string;                              // İl (opsiyonel)
  district?: string;                         // İlçe (opsiyonel)
  isRented: boolean;                         // Kiraya verilmiş mi?
  annualRentIncome?: number;                 // Yıllık kira geliri
  rentalDayOfMonth?: number;                 // Kira günü (1-31)
  contractStartDate?: string;               // Sözleşme başlangıç tarihi (ISO)
  contractEndDate?: string;                  // Sözleşme bitiş tarihi (ISO)
  monthlyRentAmount?: number;               // Aylık kira tutarı
  isRetired: boolean;                        // Emekli mi? (muafiyet için)
  isSingleProperty: boolean;                 // Tek ev mi?
  hasOtherIncome: boolean;                   // Faiz geliri vb. var mı?
  createdAt: Date;
}
 
export type PropertyType = Property['type'];
export type LocationType = Property['location'];
 
// ============= Araç (Vehicle) Types =============
 
export interface Vehicle {
  id: string;
  name: string;                              // "Audi A4", "Honda Civic"
  plate: string;                             // Plaka
  registrationDate: Date;                    // Tescil tarihi
  isPost2018: boolean;                       // 2018 sonrası mı? (MTV hesaplama)
  engineCC: number;                          // Motor hacmi (cc)
  purchaseValue?: number;                    // Alış değeri (matrah)
  lastInspectionDate?: Date;                 // Son muayene tarihi
  vehicleType: 'otomobil' | 'ticari' | 'motosiklet';
  isDisabledExempt: boolean;                 // Engelli muafiyeti
  disabledExemptDate?: Date;                 // Muafiyet tarihi (10 yıl satış yasağı)
  createdAt: Date;
}
 
export type VehicleType = Vehicle['vehicleType'];
 
// ============= İş Yeri (Business) Types =============
 
export interface Business {
  id: string;
  name: string;
  profession: 'kuyumcu' | 'oto_galeri' | 'emlakci' | 'hastane' | 'muayenehane' | 'diger';
  hasAnnualFee: boolean;                     // Yıllık harç gerekiyor mu?
  createdAt: Date;
}
 
export type ProfessionType = Business['profession'];
 
// ============= Tax Calculation Results =============
 
export interface PropertyTaxResult {
  annualTax: number;
  installment1: number;
  installment2: number;
  isExempt: boolean;
  exemptReason?: string;
  value2026: number;
  taxRate: number;
}
 
export interface RentalDeclarationResult {
  required: boolean;
  exemptAmount: number;
  taxableAmount: number;
  declarationDeadline: Date;
  warning?: string;
}
 
export interface VehicleTaxResult {
  annualTax: number;
  installment1: number;
  installment2: number;
  nextInspectionDate: Date;
  inspectionDaysRemaining: number;
}
 
export interface DisabledSaleRestrictionResult {
  isBanned: boolean;
  banEndDate: Date;
  yearsRemaining: number;
  penalty?: string;
}
 
export interface VehicleSaleFeeResult {
  notaryFee: number;
  totalFee: number;
}
 
// ============= Tax Constants =============
 
export const ASSET_TAX_CONSTANTS = {
  // Emlak Vergisi Oranları (Binde)
  PROPERTY_TAX_RATES: {
    konut: { buyuksehir: 2, diger: 1 },      // Binde 2 / Binde 1
    isyeri: { buyuksehir: 4, diger: 2 },     // Binde 4 / Binde 2
    arsa: { buyuksehir: 6, diger: 3 },       // Binde 6 / Binde 3
  },
  
  // 2026 Özel Kuralı: Değer artışı max 2 kat fazlası (toplam 3x)
  MAX_VALUE_INCREASE_MULTIPLIER: 3,          // 2025 değeri x 3 = tavan
  
  // Emlak Vergisi Taksit Tarihleri
  PROPERTY_TAX_DEADLINES: {
    FIRST_INSTALLMENT: { startMonth: 3, startDay: 1, endMonth: 5, endDay: 31 },
    SECOND_INSTALLMENT: { startMonth: 11, startDay: 1, endMonth: 11, endDay: 30 },
  },
  
  // Kira Geliri
  RENTAL_INCOME: {
    EXEMPT_AMOUNT_KONUT: 58000,              // 2026 konut kira istisnası
    EXEMPT_AMOUNT_ISYERI: 400000,            // 2026 iş yeri beyan sınırı
    DECLARATION_MONTH: 3,                    // Mart ayı
    PAYMENT_MONTHS: [3, 7],                  // Mart ve Temmuz
    INTEREST_DEDUCTION_WARNING: "Konut kira geliriniz için kredi faizini gider düşemezsiniz!",
  },
  
  // Değerli Konut Vergisi
  LUXURY_PROPERTY_THRESHOLD: 15709000,       // 15.7 milyon TL
  LUXURY_PROPERTY_DECLARATION_DATE: { month: 2, day: 20 }, // 20 Şubat
  
  // Muafiyet Koşulları
  EXEMPTION: {
    MAX_SQ_METERS: 200,                      // 200 m² altı
    MAX_OTHER_INCOME: 230000,                // 2024 için 230.000 TL faiz geliri sınırı
  },
};
 
export const VEHICLE_TAX_CONSTANTS = {
  // MTV Taksit Tarihleri
  MTV_DEADLINES: {
    FIRST_INSTALLMENT: { month: 1, day: 31 },   // Ocak sonu (2026'da 2 Şubat hafta sonu)
    SECOND_INSTALLMENT: { month: 7, day: 31 },  // Temmuz sonu
  },
  
  // 2026 MTV Artış Oranı
  MTV_INCREASE_RATE: 18.95,                  // %18.95
  
  // Muayene Periyotları (yıl olarak)
  INSPECTION_PERIODS: {
    OTOMOBIL_FIRST: 3,                       // İlk 3 yıl sonra
    OTOMOBIL_AFTER: 2,                       // Sonra her 2 yılda bir
    TICARI: 1,                               // Her yıl
    MOTOSIKLET_FIRST: 3,                     // İlk 3 yıl sonra
    MOTOSIKLET_AFTER: 2,                     // Sonra her 2 yılda bir
  },
  
  // Engelli Araç Kuralları
  DISABLED_VEHICLE: {
    OTV_EXEMPT_LIMIT: 2873900,               // 2.873.900 TL
    SALE_BAN_YEARS: 10,                      // 10 yıl satış yasağı (2025 sonrası)
    DOMESTIC_CONTENT_RATE: 40,               // %40 yerlilik şartı
    BAN_START_DATE: new Date('2025-01-01'),  // 1 Ocak 2025
  },
  
  // Araç Satış Harcı (2026)
  SALE_NOTARY_FEE_RATE: 2,                   // Binde 2
  SALE_NOTARY_FEE_MIN: 1000,                 // Minimum 1.000 TL
 
  // Muayene uyarıları
  INSPECTION_WARNINGS: {
    MTV_DEBT_WARNING: "MTV borcunuz veya trafik cezanız varsa muayene randevusu alamazsınız!",
    DAYS_BEFORE_WARNING: 30,                 // 30 gün önce uyarı
  },
};
 
export const BUSINESS_TAX_CONSTANTS = {
  // 4. Dönem Geçici Vergi (geri getirildi)
  QUARTERLY_TAX_4TH_PERIOD: { month: 2 },    // Şubat
  
  // Yıllık Harç Gereken Meslekler
  ANNUAL_FEE_PROFESSIONS: ['kuyumcu', 'oto_galeri', 'emlakci', 'hastane', 'muayenehane'] as ProfessionType[],
  
  // Harç ödeme ayı
  ANNUAL_FEE_MONTH: 1,                       // Ocak ayı
};
 
// ============= UI Labels =============
 
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  konut: 'Konut',
  isyeri: 'İş Yeri',
  arsa: 'Arsa',
};
 
export const LOCATION_LABELS: Record<LocationType, string> = {
  buyuksehir: 'Büyükşehir',
  diger: 'Diğer İl',
};
 
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  otomobil: 'Otomobil',
  ticari: 'Ticari Araç',
  motosiklet: 'Motosiklet',
};
 
export const PROFESSION_LABELS: Record<ProfessionType, string> = {
  kuyumcu: 'Kuyumcu',
  oto_galeri: 'Oto Galeri',
  emlakci: 'Emlakçı',
  hastane: 'Özel Hastane',
  muayenehane: 'Muayenehane',
  diger: 'Diğer',
};
 