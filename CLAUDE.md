# Proje: Kredy
> Kişisel finans yönetim uygulaması — Türkiye pazarı odaklı
> Son güncelleme: 2026-03-09

## 📱 Platform
iOS + Android — Capacitor 8 + React 18 + TypeScript 5 + Vite 5
- Bundle ID: `com.finansatlas.app`
- Classic Mode (detaylı) + Simple Mode (sade, animasyonlu)

## 🔧 Servisler & API'ler

| Servis | Kullanım |
|--------|----------|
| Firebase Auth | Google, Apple, Email sign-in |
| Firebase RTDB | Aile senkronizasyon, cloud backup (`backups/{uid}`) |
| APNs HTTP/2 | iOS push (Cloud Function üzerinden doğrudan) |
| FCM | Android push bildirimleri |
| Gemini 2.5 Flash | Fiş OCR (Vision API) + NLP harcama ayrıştırma |
| exchangerate-api.com | Döviz kurları (USD, EUR, GBP → TRY) |
| collects.online/altınApi | Altın/gümüş fiyatları |
| CoinGecko | Kripto fiyatları |
| Yahoo Finance (proxy) | BIST + US hisse fiyatları |
| StoreKit 2 (iOS) | Uygulama içi satın alma |
| Google Play Billing | Uygulama içi satın alma |
| Capacitor Native Biometric | Face ID / parmak izi |

## ⚡ Komutlar
- Dev: `npm run dev`
- Build: `npx cap sync`
- iOS sync: `npx cap sync ios`
- Android sync: `npx cap sync android`
- Test: `npx vitest`
- Functions deploy: `firebase deploy --only functions`

## 💰 Monetizasyon
- **Free**: 2 kart, 2 hesap, 3 fatura, 1 hedef, 50 aylık işlem
- **PRO**: Sınırsız + AI, yatırım, varlık yönetimi, ticari analiz, aile sync, widget
- 7 günlük deneme süresi
- Fiyat: $1.99/ay (dünya geneli), Türkiye: ₺39.99/ay veya ₺399.99/yıl
- Product ID: `com.finansatlas.app.pro.monthly` / `com.finansatlas.app.pro.yearly`

## 📁 Proje Yapısı

```
src/
├── pages/              # 22 sayfa/ekran
├── components/         # 60+ bileşen
│   ├── ui/             # Shadcn/Radix UI primitives (30+)
│   ├── finance/        # Finans bileşenleri
│   ├── family/         # Aile finans bileşenleri (20+)
│   ├── installments/   # Taksit bileşenleri
│   ├── investment/     # Yatırım bileşenleri
│   └── widgets/        # Home screen widget bileşenleri
├── contexts/           # 7 context provider
├── hooks/              # 40+ custom hook
├── lib/                # 18+ servis/utility dosyası
├── types/              # 6 type tanım dosyası
├── data/               # Widget, FAQ, şehir verileri
├── i18n/               # 5 dil × 14 namespace
│   └── locales/
│       ├── tr/         # Türkçe (birincil)
│       ├── en/         # İngilizce
│       ├── ar/         # Arapça
│       ├── ru/         # Rusça
│       └── uk/         # Ukraynaca
└── test/               # Test dosyaları

functions/              # Firebase Cloud Functions (Node.js 20, Europe-West1)
ios/                    # iOS native (Capacitor)
android/                # Android native (Capacitor)
```

## ✅ Tamamlanan Özellikler

### Kredi Kartı Yönetimi
- Kart CRUD (ekleme, düzenleme, silme)
- Ekstre takibi ve hesap özeti
- Altın pencere (golden window) hesaplama
- Alışveriş formu ve satın alma geçmişi
- Taksit planları yönetimi
- Borç çevirme simülatörü
- Yeniden yapılandırma simülatörü

### Kişisel Finans
- Gelir/gider takibi (kategori bazlı)
- Düzenli ödemeler (faturalar, abonelikler, giderler, gelirler)
- Bütçe hedefleri
- Banka hesapları yönetimi
- İşlem geçmişi
- Güvenli harcama (SafeToSpend) widget'ı

### Yatırım Portföyü (PRO)
- Altın (22 çeşit), gümüş, döviz, hisse (BIST/US), kripto
- Canlı fiyat güncelleme
- Portföy pasta grafiği ve özet

### Varlık Yönetimi (PRO)
- Gayrimenkul (konut/işyeri/arsa) — emlak vergisi, kira geliri
- Araç — MTV, muayene takibi, engelli muafiyeti
- Vergi takvimi (emlak vergisi, MTV tarihleri)

### Kredi Simülatörü
- Amortisman hesaplama
- Kredi türü seçici
- Gecikme faizi simülasyonu
- Kredilerim listesi

### AI Özellikleri (PRO)
- Harcama analizi ve anomali tespiti
- AI bütçe önerisi
- Borç ödeme stratejisi (Avalanche/Snowball)
- NLP doğal dil harcama girişi
- Fiş tarayıcı (Gemini Vision)
- Findeks kredi skoru simülatörü

### Ticari Kart Analizi (PRO)
- KDV analizi
- Vergi hesaplamaları
- Harcama grafikleri
- Ödeme takvimi

### Aile Finansı
- Aile grubu oluştur/katıl/ayrıl
- Firebase RTDB ile gerçek zamanlı senkronizasyon
- Ortak cüzdan
- Aile aktivite bildirimleri
- Üye varlık durumu

### Bildirimler
- Push notification (APNs + FCM)
- Yerel bildirimler (kart vadesi, kredi taksiti, fatura)
- Bildirim inbox (okundu/yapıldı/sil)
- Bildirim ayarları (kategori bazlı toggle)
- Bildirim sesleri (4 kategori)

### Analitik & Takvim
- İşlem özet grafikleri
- Finansal sağlık skoru
- Ödeme takvimi (haftalık + aylık grid)
- Altın pencere takvim görünümü

### Widget Galerisi (PRO)
- 15+ iOS/Android home screen widget
- Ciddi/komik/eğlenceli kategoriler

### Güvenlik & Gizlilik
- PIN kilidi (ipucu sorularıyla)
- Face ID / parmak izi biyometrik
- Gizlilik modu (tutarları bulanıklaştır)
- Screenshot modu (demo verisi)

### Cloud & Sync
- Firebase cloud backup/restore
- Otomatik senkronizasyon
- Offline-first (localStorage birincil)
- WKWebView uyumlu REST API fallback

### Kullanıcı Deneyimi
- 2 mod: Classic (detaylı) + Simple (sade, cam efektli)
- 8 tema
- 5 dil desteği (TR, EN, AR, RU, UK)
- Onboarding akışı
- Yardım & Destek (12 kategori FAQ)
- Framer Motion animasyonları
- Haptic feedback

### Monetizasyon
- Abonelik sistemi (aylık/yıllık)
- Free tier limitleri
- PRO paywall
- 7 gün deneme süresi

## 🔑 Önemli Dosyalar

### Contexts
| Dosya | Görev |
|-------|-------|
| `AuthContext.tsx` | PIN + biyometrik doğrulama |
| `CloudAuthContext.tsx` | Firebase Auth (Google, Apple, Email) |
| `FamilySyncContext.tsx` | Aile grubu senkronizasyon |
| `SubscriptionContext.tsx` | IAP abonelik durumu |
| `SimpleModeContext.tsx` | Classic/Simple mod geçişi |
| `PrivacyModeContext.tsx` | Gizlilik modu |
| `InvestmentPricesContext.tsx` | Yatırım fiyat cache |

### Kritik Lib Dosyaları
| Dosya | Görev |
|-------|-------|
| `firebase.ts` | Firebase RTDB — lazy SDK + REST API |
| `cloudAuth.ts` | Firebase Auth (Google, Apple, Email) |
| `cloudBackup.ts` | Backup/restore |
| `iapService.ts` | StoreKit 2 + Google Play Billing |
| `financeUtils.ts` | 2026 BDDK faiz oranları, altın pencere, finansal sağlık |
| `overdueUtils.ts` | Amortisman, gecikme faizi |
| `assetTaxUtils.ts` | Emlak vergisi, MTV, muayene |
| `naturalLanguageParser.ts` | Gemini NLP harcama ayrıştırıcı |
| `geminiReceiptScanner.ts` | Gemini Vision fiş OCR |
| `premiumLimits.ts` | Free tier limitleri |
| `kmhUtils.ts` | KDV, ÖTV, vergi hesaplamaları |
| `notificationBridge.ts` | Capacitor → CustomEvent köprüsü |

### Firebase Functions
| Dosya | Görev |
|-------|-------|
| `functions/index.js` | `onFamilyDataChange` — aile push bildirimi (APNs + FCM) |

## 🚧 Devam Eden
<!-- Manuel ekle -->

## 📝 Notlar
- Bu projede Türkçe, Arapça, İngilizce, Rusça ve Ukraynaca dil desteği zorunlu. Diğer dillere gerek yok.
- Firebase sistemi ve anlık bildirim çok önemli.
- Veri saklama: localStorage (offline-first) + Firebase RTDB (sync/backup)
- WKWebView uyumluluğu için tüm Firebase çağrıları REST API fallback kullanır

## ❗ Proje Özel Kurallar
- Xcode açmak için kullanıcı açıkça istemelidir
- Firebase RTDB instance: `finans-atlas-pro-default-rtdb` (europe-west1)
- Cloud Functions region: `europe-west1`
- APNs Key ID: `SFPDXXFF3M`, Team ID: `59ZAKYY5YZ`
