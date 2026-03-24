#!/usr/bin/env node
/**
 * Kredy App Store Screenshot Pipeline v2
 * 5 dil × 10 ekran × 3 iOS cihaz = 150 raw → mockup
 */
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:8083';
const ROOT = '/Users/neslihan/Desktop/uygulama/Kredy';
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots');

const IOS_DEVICES = {
  'iphone-6.9': { width: 430, height: 932, scale: 3, mockW: 1290, mockH: 2796 },
  'ipad-13':    { width: 1032, height: 1376, scale: 2, mockW: 2064, mockH: 2752 },
  'mac':        { width: 1440, height: 900, scale: 2, mockW: 2880, mockH: 1800 },
};

const ALL_LANGUAGES = ['tr', 'en', 'ar', 'ru', 'uk'];
const LANGUAGES = process.argv[2] ? process.argv[2].split(',') : ALL_LANGUAGES;

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

// ─── Demo Data — DOĞRU KEY VE TYPE YAPILARI ───
function generateDemoData(lang) {
  const now = new Date();
  const categories = ['market', 'ulasim', 'fatura', 'yemek', 'saglik', 'giyim', 'eglence', 'egitim'];

  const names = {
    tr: 'Neslihan', en: 'Sarah', ar: 'فاطمة', ru: 'Анна', uk: 'Оксана',
  };
  const familyNames = {
    tr: 'Özdemir Ailesi', en: 'Johnson Family', ar: 'عائلة أحمد', ru: 'Семья Ивановых', uk: 'Родина Шевченко',
  };

  // FamilyTransaction type: id, type, amount, category, description, date, currency
  const incomeCats = ['maas', 'ek-gelir', 'kira-gelir', 'yatirim-gelir', 'diger-gelir'];
  const expenseCats = ['market', 'kira', 'fatura', 'ulasim', 'saglik', 'egitim', 'eglence', 'giyim', 'yemek'];
  const incomeDescs = ['Maaş', 'Freelance', 'Kira Geliri', 'Faiz Geliri', 'Bonus'];
  const expenseDescs = ['Migros', 'A101', 'Elektrik', 'Benzin', 'Netflix', 'Restoran', 'Eczane', 'Zara'];

  const transactions = [];
  for (let m = 0; m < 12; m++) {
    // Her ay 2 gelir + 4 gider
    for (let i = 0; i < 2; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const d = new Date(now.getFullYear(), now.getMonth() - m, day);
      transactions.push({
        id: `tx-i-${m}-${i}`,
        type: 'income',
        amount: [25000, 8500, 22000, 3200, 5000][Math.floor(Math.random() * 5)],
        category: incomeCats[Math.floor(Math.random() * incomeCats.length)],
        description: incomeDescs[Math.floor(Math.random() * incomeDescs.length)],
        date: d.toISOString(),
        currency: 'TRY',
      });
    }
    for (let i = 0; i < 4; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const d = new Date(now.getFullYear(), now.getMonth() - m, day);
      transactions.push({
        id: `tx-e-${m}-${i}`,
        type: 'expense',
        amount: Math.floor(Math.random() * 3000) + 50,
        category: expenseCats[Math.floor(Math.random() * expenseCats.length)],
        description: expenseDescs[Math.floor(Math.random() * expenseDescs.length)],
        date: d.toISOString(),
        currency: 'TRY',
      });
    }
  }

  // CreditCard type: id, bankName, cardName, lastFourDigits, cardType, limit,
  //   currentDebt, availableLimit, minimumPayment, statementDate, dueDate, interestRate, color
  const cards = [
    {
      id: 'card-1', bankName: 'Garanti BBVA', cardName: 'Garanti Bonus',
      lastFourDigits: '4521', cardType: 'bireysel',
      limit: 75000, currentDebt: 23500, availableLimit: 51500,
      minimumPayment: 4700, statementDate: 15, dueDate: 5,
      interestRate: 4.42, color: '#0D9F6E',
    },
    {
      id: 'card-2', bankName: 'Yapı Kredi', cardName: 'Yapı Kredi World',
      lastFourDigits: '8734', cardType: 'bireysel',
      limit: 50000, currentDebt: 18200, availableLimit: 31800,
      minimumPayment: 3640, statementDate: 20, dueDate: 10,
      interestRate: 4.42, color: '#2563EB',
    },
    {
      id: 'card-3', bankName: 'İş Bankası', cardName: 'İş Bankası Ticari',
      lastFourDigits: '6291', cardType: 'ticari',
      limit: 150000, currentDebt: 67800, availableLimit: 82200,
      minimumPayment: 13560, statementDate: 25, dueDate: 15,
      interestRate: 4.42, color: '#7C3AED',
    },
    {
      id: 'card-4', bankName: 'Akbank', cardName: 'Akbank Axess',
      lastFourDigits: '3187', cardType: 'bireysel',
      limit: 40000, currentDebt: 12300, availableLimit: 27700,
      minimumPayment: 2460, statementDate: 10, dueDate: 1,
      interestRate: 4.42, color: '#DC2626',
    },
  ];

  // Investments — DOĞRU Investment TYPE (category/subType/quantity/purchasePrice/purchaseDate/createdAt)
  const investments = [
    { id: 'inv-1', category: 'altin', subType: 'gram_altin', quantity: 25, purchasePrice: 2850, purchaseDate: '2025-06-15', createdAt: '2025-06-15T10:00:00Z' },
    { id: 'inv-2', category: 'altin', subType: 'ceyrek_altin', quantity: 4, purchasePrice: 4650, purchaseDate: '2025-09-20', createdAt: '2025-09-20T10:00:00Z' },
    { id: 'inv-3', category: 'altin', subType: 'yarim_altin', quantity: 2, purchasePrice: 9200, purchaseDate: '2025-03-10', createdAt: '2025-03-10T10:00:00Z' },
    { id: 'inv-4', category: 'gumus', subType: 'gumus_gram', quantity: 100, purchasePrice: 38, purchaseDate: '2025-07-01', createdAt: '2025-07-01T10:00:00Z' },
    { id: 'inv-5', category: 'doviz', subType: 'USD', quantity: 5000, purchasePrice: 34.50, purchaseDate: '2025-08-01', createdAt: '2025-08-01T10:00:00Z' },
    { id: 'inv-6', category: 'doviz', subType: 'EUR', quantity: 3000, purchasePrice: 37.80, purchaseDate: '2025-07-15', createdAt: '2025-07-15T10:00:00Z' },
    { id: 'inv-7', category: 'doviz', subType: 'GBP', quantity: 2000, purchasePrice: 43.20, purchaseDate: '2025-10-05', createdAt: '2025-10-05T10:00:00Z' },
    { id: 'inv-8', category: 'hisse', subType: 'THYAO', customName: 'Türk Hava Yolları', exchange: 'BIST', quantity: 500, purchasePrice: 285, purchaseDate: '2025-04-10', createdAt: '2025-04-10T10:00:00Z' },
    { id: 'inv-9', category: 'hisse', subType: 'ASELS', customName: 'Aselsan', exchange: 'BIST', quantity: 200, purchasePrice: 62, purchaseDate: '2025-05-20', createdAt: '2025-05-20T10:00:00Z' },
    { id: 'inv-10', category: 'hisse', subType: 'AAPL', customName: 'Apple Inc.', exchange: 'NASDAQ', quantity: 10, purchasePrice: 185, purchaseDate: '2025-06-01', createdAt: '2025-06-01T10:00:00Z' },
    { id: 'inv-11', category: 'hisse', subType: 'SISE', customName: 'Şişecam', exchange: 'BIST', quantity: 1000, purchasePrice: 48, purchaseDate: '2025-02-15', createdAt: '2025-02-15T10:00:00Z' },
    { id: 'inv-12', category: 'kripto', subType: 'BTC', customName: 'Bitcoin', quantity: 0.15, purchasePrice: 62000, purchaseDate: '2025-03-01', createdAt: '2025-03-01T10:00:00Z' },
    { id: 'inv-13', category: 'kripto', subType: 'ETH', customName: 'Ethereum', quantity: 2.5, purchasePrice: 3200, purchaseDate: '2025-05-10', createdAt: '2025-05-10T10:00:00Z' },
    { id: 'inv-14', category: 'kripto', subType: 'SOL', customName: 'Solana', quantity: 50, purchasePrice: 145, purchaseDate: '2025-07-20', createdAt: '2025-07-20T10:00:00Z' },
  ];

  // Properties — DOĞRU Property TYPE
  const properties = [
    {
      id: 'prop-1', name: 'Kadıköy Daire', type: 'konut', location: 'buyuksehir',
      valuePreviousYear: 5200000, currentValue: 8500000, sqMeters: 120, city: 'istanbul',
      isRented: true, annualRentIncome: 264000, rentalDayOfMonth: 1,
      monthlyRentAmount: 22000, isRetired: false, isSingleProperty: false,
      hasOtherIncome: true, createdAt: '2021-05-15T00:00:00Z',
    },
    {
      id: 'prop-2', name: 'Bodrum Yazlık', type: 'konut', location: 'diger',
      valuePreviousYear: 2800000, currentValue: 4200000, sqMeters: 85, city: 'mugla',
      isRented: false, isRetired: false, isSingleProperty: false,
      hasOtherIncome: false, createdAt: '2022-08-01T00:00:00Z',
    },
    {
      id: 'prop-3', name: 'Ofis - Levent', type: 'isyeri', location: 'buyuksehir',
      valuePreviousYear: 8000000, currentValue: 12000000, sqMeters: 200, city: 'istanbul',
      isRented: true, annualRentIncome: 540000, rentalDayOfMonth: 5,
      monthlyRentAmount: 45000, isRetired: false, isSingleProperty: false,
      hasOtherIncome: true, createdAt: '2020-01-10T00:00:00Z',
    },
  ];

  // Vehicles — DOĞRU Vehicle TYPE
  const vehicles = [
    {
      id: 'veh-1', name: 'BMW 320i', plate: '34 ABC 123',
      registrationDate: '2023-03-15T00:00:00Z', isPost2018: true,
      engineCC: 1998, purchaseValue: 2800000, vehicleType: 'otomobil',
      lastInspectionDate: '2025-08-15T00:00:00Z', isDisabledExempt: false,
      createdAt: '2023-03-15T00:00:00Z',
    },
    {
      id: 'veh-2', name: 'Mercedes C200', plate: '34 XYZ 456',
      registrationDate: '2024-06-01T00:00:00Z', isPost2018: true,
      engineCC: 1496, purchaseValue: 3500000, vehicleType: 'otomobil',
      lastInspectionDate: '2026-12-01T00:00:00Z', isDisabledExempt: false,
      createdAt: '2024-06-01T00:00:00Z',
    },
  ];

  // InboxNotification type: id, title, message, type (NotificationType), createdAt, isRead, isDone, severity ('info'|'warning'|'danger')
  // NotificationType: 'payment'|'golden'|'tax'|'inspection'|'rent'|'budget'|'goal'|'subscription'|'overdue'|'bill'|'family'
  const notifNow = Date.now();
  const notifications = [
    { id: 'n1', type: 'payment', title: 'Kart Vadesi Yaklaşıyor', message: 'Garanti Bonus kartınızın son ödeme tarihi 3 gün sonra', createdAt: new Date(notifNow - 3600000).toISOString(), isRead: false, isDone: false, severity: 'warning', assetType: 'card', assetId: 'card-1' },
    { id: 'n2', type: 'bill', title: 'Fatura Hatırlatması', message: 'Elektrik faturası yarın son ödeme günü', createdAt: new Date(notifNow - 7200000).toISOString(), isRead: false, isDone: false, severity: 'warning', assetType: 'bill', assetId: 'bill-1' },
    { id: 'n3', type: 'budget', title: 'Bütçe Uyarısı', message: 'Market bütçenizin %90\'ına ulaştınız', createdAt: new Date(notifNow - 86400000).toISOString(), isRead: false, isDone: false, severity: 'danger' },
    { id: 'n4', type: 'golden', title: 'Altın Pencere Başladı!', message: 'Akbank Axess kartınız altın pencerede. Harcama için ideal!', createdAt: new Date(notifNow - 86400000 * 2).toISOString(), isRead: true, isDone: false, severity: 'info', assetType: 'card', assetId: 'card-4' },
    { id: 'n5', type: 'family', title: 'Aile Aktivitesi', message: 'Gökhan 2.500₺ harcama ekledi', createdAt: new Date(notifNow - 86400000 * 2).toISOString(), isRead: true, isDone: false, severity: 'info' },
    { id: 'n6', type: 'overdue', title: 'Gecikmiş Ödeme!', message: 'İhtiyaç kredisi taksitiniz 2 gün gecikti', createdAt: new Date(notifNow - 86400000 * 3).toISOString(), isRead: false, isDone: false, severity: 'danger', assetType: 'loan', assetId: 'loan-1' },
    { id: 'n7', type: 'goal', title: 'Hedef Tamamlandı!', message: 'Tatil fonu hedefinize ulaştınız: 50.000₺', createdAt: new Date(notifNow - 86400000 * 5).toISOString(), isRead: true, isDone: true, severity: 'info' },
    { id: 'n8', type: 'subscription', title: 'Abonelik Yenilenecek', message: 'Netflix aboneliğiniz 3 gün sonra yenilenecek', createdAt: new Date(notifNow - 86400000 * 4).toISOString(), isRead: false, isDone: false, severity: 'info' },
    { id: 'n9', type: 'tax', title: 'Vergi Hatırlatması', message: 'Emlak vergisi 1. taksit son ödeme 31 Mayıs', createdAt: new Date(notifNow - 86400000 * 6).toISOString(), isRead: false, isDone: false, severity: 'warning' },
    { id: 'n10', type: 'payment', title: 'Ödeme Onayı', message: 'Yapı Kredi World 3.640₺ minimum ödeme yapıldı', createdAt: new Date(notifNow - 86400000 * 7).toISOString(), isRead: true, isDone: true, severity: 'info', assetType: 'card', assetId: 'card-2' },
    { id: 'n11', type: 'inspection', title: 'Araç Muayenesi', message: 'BMW 320i muayene tarihi 2 gün sonra', createdAt: new Date(notifNow - 86400000 * 1).toISOString(), isRead: false, isDone: false, severity: 'warning' },
    { id: 'n12', type: 'rent', title: 'Kira Geliri', message: 'Kadıköy Daire kira geliri bugün bekleniyor: 22.000₺', createdAt: new Date(notifNow - 86400000 * 8).toISOString(), isRead: true, isDone: true, severity: 'info' },
  ];

  // RecurringBill type: id, name, frequency, dayOfMonth, isFixedAmount, fixedAmount, lastPaidAmount, category, currency, isActive, icon, notes, history
  const bills = [
    {
      id: 'bill-1', name: 'Elektrik', frequency: 'monthly', dayOfMonth: 15,
      isFixedAmount: false, lastPaidAmount: 850, category: 'fatura', currency: 'TRY',
      isActive: true, icon: '⚡', history: [
        { id: 'bp-1a', amount: 850, date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(), isPaid: true },
        { id: 'bp-1b', amount: 780, date: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(), isPaid: true },
      ],
    },
    {
      id: 'bill-2', name: 'Doğalgaz', frequency: 'monthly', dayOfMonth: 20,
      isFixedAmount: false, lastPaidAmount: 420, category: 'fatura', currency: 'TRY',
      isActive: true, icon: '🔥', history: [
        { id: 'bp-2a', amount: 420, date: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString(), isPaid: true },
      ],
    },
    {
      id: 'bill-3', name: 'İnternet', frequency: 'monthly', dayOfMonth: 10,
      isFixedAmount: true, fixedAmount: 350, lastPaidAmount: 350, category: 'fatura', currency: 'TRY',
      isActive: true, icon: '🌐', history: [
        { id: 'bp-3a', amount: 350, date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(), isPaid: true },
        { id: 'bp-3b', amount: 350, date: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(), isPaid: true },
      ],
    },
    {
      id: 'bill-4', name: 'Su', frequency: 'monthly', dayOfMonth: 25,
      isFixedAmount: false, lastPaidAmount: 180, category: 'fatura', currency: 'TRY',
      isActive: true, icon: '💧', history: [
        { id: 'bp-4a', amount: 180, date: new Date(now.getFullYear(), now.getMonth() - 1, 25).toISOString(), isPaid: true },
      ],
    },
    {
      id: 'bill-5', name: 'Telefon', frequency: 'monthly', dayOfMonth: 18,
      isFixedAmount: true, fixedAmount: 250, lastPaidAmount: 250, category: 'fatura', currency: 'TRY',
      isActive: true, icon: '📱', history: [
        { id: 'bp-5a', amount: 250, date: new Date(now.getFullYear(), now.getMonth(), 18).toISOString(), isPaid: true },
      ],
    },
    {
      id: 'bill-6', name: 'Kira', frequency: 'monthly', dayOfMonth: 1,
      isFixedAmount: true, fixedAmount: 18000, lastPaidAmount: 18000, category: 'kira', currency: 'TRY',
      isActive: true, icon: '🏠', history: [
        { id: 'bp-6a', amount: 18000, date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), isPaid: true },
        { id: 'bp-6b', amount: 18000, date: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), isPaid: true },
      ],
    },
  ];

  // Subscription type: id, name, amount, currency, billingCycle, billingDate, category, isActive, icon, startDate
  const subscriptions = [
    { id: 'sub-1', name: 'Netflix', amount: 149, currency: 'TRY', billingCycle: 'monthly', billingDate: 5, category: 'video', isActive: true, icon: '🎬', startDate: '2024-01-05' },
    { id: 'sub-2', name: 'Spotify', amount: 59, currency: 'TRY', billingCycle: 'monthly', billingDate: 12, category: 'muzik', isActive: true, icon: '🎵', startDate: '2023-06-12' },
    { id: 'sub-3', name: 'iCloud+', amount: 49, currency: 'TRY', billingCycle: 'monthly', billingDate: 1, category: 'bulut', isActive: true, icon: '☁️', startDate: '2023-09-01' },
    { id: 'sub-4', name: 'YouTube Premium', amount: 79, currency: 'TRY', billingCycle: 'monthly', billingDate: 20, category: 'video', isActive: true, icon: '▶️', startDate: '2024-03-20' },
    { id: 'sub-5', name: 'ChatGPT Plus', amount: 20, currency: 'USD', billingCycle: 'monthly', billingDate: 8, category: 'yazilim', isActive: true, icon: '🤖', startDate: '2024-06-08' },
  ];

  // Budget type: id, month, year, totalIncome, categories (BudgetCategory[])
  const curMonth = now.getMonth(); // 0-11
  const curYear = now.getFullYear();
  const budgets = [
    {
      id: 'bgt-1', month: curMonth, year: curYear, totalIncome: 45000,
      categories: [
        { id: 'bc-1', name: 'Market', allocated: 8000, spent: 6450, icon: '🛒', color: '#22C55E' },
        { id: 'bc-2', name: 'Ulaşım', allocated: 3000, spent: 2100, icon: '🚗', color: '#3B82F6' },
        { id: 'bc-3', name: 'Yemek', allocated: 4000, spent: 3800, icon: '🍽️', color: '#F59E0B' },
        { id: 'bc-4', name: 'Fatura', allocated: 3000, spent: 2050, icon: '📄', color: '#EF4444' },
        { id: 'bc-5', name: 'Eğlence', allocated: 2000, spent: 1350, icon: '🎮', color: '#8B5CF6' },
        { id: 'bc-6', name: 'Sağlık', allocated: 1500, spent: 800, icon: '💊', color: '#EC4899' },
        { id: 'bc-7', name: 'Giyim', allocated: 2500, spent: 1900, icon: '👗', color: '#06B6D4' },
      ],
    },
  ];

  // Goal type: id, name, targetAmount, currentAmount, currency, deadline, icon, color, contributions
  const goals = [
    {
      id: 'goal-1', name: 'Tatil Fonu', targetAmount: 50000, currentAmount: 50000,
      currency: 'TRY', deadline: '2026-06-01', icon: '✈️', color: '#3B82F6',
      contributions: [
        { id: 'gc-1a', amount: 10000, date: '2025-08-01', note: 'Maaş' },
        { id: 'gc-1b', amount: 15000, date: '2025-10-01', note: 'Bonus' },
        { id: 'gc-1c', amount: 25000, date: '2026-01-01', note: 'Tasarruf' },
      ],
    },
    {
      id: 'goal-2', name: 'Acil Durum Fonu', targetAmount: 100000, currentAmount: 72000,
      currency: 'TRY', deadline: '2026-12-31', icon: '🛡️', color: '#EF4444',
      contributions: [
        { id: 'gc-2a', amount: 20000, date: '2025-06-01' },
        { id: 'gc-2b', amount: 25000, date: '2025-09-01' },
        { id: 'gc-2c', amount: 27000, date: '2026-01-15' },
      ],
    },
    {
      id: 'goal-3', name: 'Yeni Araba', targetAmount: 500000, currentAmount: 185000,
      currency: 'TRY', deadline: '2027-06-01', icon: '🚗', color: '#22C55E',
      contributions: [
        { id: 'gc-3a', amount: 50000, date: '2025-04-01' },
        { id: 'gc-3b', amount: 60000, date: '2025-08-01' },
        { id: 'gc-3c', amount: 75000, date: '2026-01-01' },
      ],
    },
  ];

  // Account type: id, name, type, balance, currency, icon, color, bankName, isActive
  const accounts = [
    { id: 'acc-1', name: 'Garanti Vadesiz', type: 'bank', balance: 45200, currency: 'TRY', icon: '🏦', color: '#0D9F6E', bankName: 'Garanti BBVA', isActive: true },
    { id: 'acc-2', name: 'İş Bankası Vadeli', type: 'bank', balance: 125000, currency: 'TRY', icon: '🏦', color: '#2563EB', bankName: 'İş Bankası', isActive: true },
    { id: 'acc-3', name: 'Nakit', type: 'cash', balance: 3500, currency: 'TRY', icon: '💵', color: '#22C55E', isActive: true },
    { id: 'acc-4', name: 'Dolar Hesabı', type: 'bank', balance: 2800, currency: 'USD', icon: '💲', color: '#F59E0B', bankName: 'Yapı Kredi', isActive: true },
  ];

  const userName = names[lang] || 'Neslihan';

  // PurchaseData type: id, cardId, amount, category, description, merchant, installments, monthlyPayment, totalAmount, date, isDeferred, deferredMonths, firstPaymentDate
  const purchases = [];
  const purchaseStores = ['Migros', 'A101', 'BIM', 'Trendyol', 'Hepsiburada', 'Amazon', 'LC Waikiki', 'Zara', 'Shell', 'Opet', 'MediaMarkt', 'Apple Store'];
  const purchaseCats = ['market', 'giyim', 'teknoloji', 'yemek', 'ulasim', 'ev', 'saglik'];
  const cardIds = ['card-1', 'card-2', 'card-3', 'card-4'];
  for (let i = 0; i < 30; i++) {
    const inst = [1, 1, 1, 3, 6, 9, 12][Math.floor(Math.random() * 7)];
    const amt = Math.floor(Math.random() * 5000) + 100;
    const pDate = new Date(now.getTime() - Math.floor(Math.random() * 180) * 86400000);
    const fPayDate = new Date(pDate.getTime() + 30 * 86400000);
    purchases.push({
      id: `pur-${i}`,
      cardId: cardIds[Math.floor(Math.random() * cardIds.length)],
      amount: amt,
      category: purchaseCats[Math.floor(Math.random() * purchaseCats.length)],
      description: purchaseStores[Math.floor(Math.random() * purchaseStores.length)],
      merchant: purchaseStores[Math.floor(Math.random() * purchaseStores.length)],
      installments: inst,
      monthlyPayment: inst > 1 ? Math.round(amt / inst) : amt,
      totalAmount: amt,
      date: pDate.toISOString(),
      isDeferred: false,
      deferredMonths: 0,
      firstPaymentDate: fPayDate.toISOString(),
    });
  }

  // Loans — for loan simulator
  const loans = [
    { id: 'loan-1', name: 'İhtiyaç Kredisi', type: 'ihtiyac', principal: 150000, interestRate: 4.42, termMonths: 36, startDate: '2025-01-15', monthlyPayment: 5420.50 },
    { id: 'loan-2', name: 'Konut Kredisi', type: 'konut', principal: 2500000, interestRate: 2.89, termMonths: 120, startDate: '2024-06-01', monthlyPayment: 35200.00 },
  ];

  return {
    lang, userName, transactions, cards, investments, properties, vehicles,
    notifications, bills, subscriptions, budgets, goals, accounts, purchases, loans,
    familyName: familyNames[lang] || 'Özdemir Ailesi',
  };
}

// ─── localStorage Injection — DOĞRU KEY'LER ───
async function injectDemoData(page, lang) {
  const d = generateDemoData(lang);
  await page.evaluate((data) => {
    const s = localStorage;
    // Dil
    s.setItem('i18nextLng', data.lang);
    // Onboarding ve permissions — BYPASS
    s.setItem('kredi-pusula-onboarding-completed', 'true');
    s.setItem('kredi-pusula-permissions-completed', 'true');
    // Simple mode OFF (klasik)
    s.setItem('kredi-pusula-simple-mode', JSON.stringify(false));
    // Screenshot mode ON — PRO aktif
    s.setItem('kredi-pusula-screenshot-mode', 'true');
    // PIN devre dışı
    s.removeItem('kredi-pusula-pin-hash');
    // Privacy mode OFF
    s.setItem('family-finance-privacy-mode', JSON.stringify(false));

    // Profil
    s.setItem('kredi-pusula-user-profile', JSON.stringify({
      name: data.userName,
      currency: '₺',
      language: data.lang,
      hidePersonalFinance: false,
    }));

    // Kartlar
    s.setItem('kredi-pusula-cards', JSON.stringify(data.cards));
    // İşlemler
    s.setItem('kredi-pusula-personal-transactions', JSON.stringify(data.transactions));
    // Faturalar
    s.setItem('kredi-pusula-personal-monthly-bills', JSON.stringify(data.bills));
    // Abonelikler
    s.setItem('kredi-pusula-personal-subscriptions', JSON.stringify(data.subscriptions));
    // Bütçe
    s.setItem('kredi-pusula-personal-budgets', JSON.stringify(data.budgets));
    // Hedefler
    s.setItem('kredi-pusula-personal-goals', JSON.stringify(data.goals));
    // Hesaplar
    s.setItem('kredi-pusula-personal-accounts', JSON.stringify(data.accounts));
    // Yatırımlar
    s.setItem('kredi-pusula-investments', JSON.stringify(data.investments));
    // Varlıklar — ayrı key'ler
    s.setItem('kredi-pusula-properties', JSON.stringify(data.properties));
    s.setItem('kredi-pusula-vehicles', JSON.stringify(data.vehicles));
    s.setItem('kredi-pusula-businesses', JSON.stringify([]));
    // Satın almalar
    s.setItem('kredi-pusula-purchases', JSON.stringify(data.purchases));
    // Krediler
    s.setItem('kredi-pusula-loans', JSON.stringify(data.loans));
    // Bildirimler
    s.setItem('kredi-pusula-notification-inbox', JSON.stringify(data.notifications));
    // Aile
    s.setItem('kredi-pusula-family', JSON.stringify({
      familyId: 'family-demo',
      memberId: 'user-demo',
      memberName: data.userName,
    }));

    // Aile Finans Verileri (FAMILY_STORAGE_KEYS)
    s.setItem('kredi-pusula-accounts', JSON.stringify([
      { id: 'facc-1', name: 'Ortak Hesap', type: 'bank', balance: 85000, currency: 'TRY', icon: '🏦', color: '#3B82F6', bankName: 'Garanti BBVA', isActive: true },
      { id: 'facc-2', name: 'Aile Tasarruf', type: 'bank', balance: 220000, currency: 'TRY', icon: '💰', color: '#22C55E', bankName: 'İş Bankası', isActive: true },
    ]));
    s.setItem('kredi-pusula-family-transactions', JSON.stringify(data.transactions.slice(0, 30).map((tx, i) => ({
      ...tx, id: `ftx-${i}`, description: tx.description + ' (Aile)',
    }))));
    s.setItem('kredi-pusula-subscriptions', JSON.stringify([
      { id: 'fsub-1', name: 'Netflix Aile', amount: 299, currency: 'TRY', billingCycle: 'monthly', billingDate: 5, category: 'video', isActive: true, icon: '🎬', startDate: '2024-01-05' },
      { id: 'fsub-2', name: 'Spotify Family', amount: 89, currency: 'TRY', billingCycle: 'monthly', billingDate: 12, category: 'muzik', isActive: true, icon: '🎵', startDate: '2023-06-12' },
    ]));
    s.setItem('kredi-pusula-budgets', JSON.stringify([{
      id: 'fbgt-1', month: new Date().getMonth(), year: new Date().getFullYear(), totalIncome: 70000,
      categories: [
        { id: 'fbc-1', name: 'Market', allocated: 12000, spent: 9800, icon: '🛒', color: '#22C55E' },
        { id: 'fbc-2', name: 'Faturalar', allocated: 5000, spent: 3200, icon: '📄', color: '#EF4444' },
        { id: 'fbc-3', name: 'Eğitim', allocated: 4000, spent: 2800, icon: '📚', color: '#3B82F6' },
        { id: 'fbc-4', name: 'Ulaşım', allocated: 3500, spent: 2100, icon: '🚗', color: '#F59E0B' },
      ],
    }]));
    s.setItem('kredi-pusula-goals', JSON.stringify([
      { id: 'fg-1', name: 'Aile Tatili', targetAmount: 80000, currentAmount: 55000, currency: 'TRY', deadline: '2026-07-01', icon: '🏖️', color: '#3B82F6', contributions: [{ id: 'fgc-1', amount: 30000, date: '2025-10-01' }, { id: 'fgc-2', amount: 25000, date: '2026-01-15' }] },
      { id: 'fg-2', name: 'Ev Tadilatı', targetAmount: 150000, currentAmount: 42000, currency: 'TRY', deadline: '2026-12-31', icon: '🏠', color: '#EF4444', contributions: [{ id: 'fgc-3', amount: 42000, date: '2025-11-01' }] },
    ]));
    s.setItem('kredi-pusula-monthly-bills', JSON.stringify([
      { id: 'fbill-1', name: 'Aidat', frequency: 'monthly', dayOfMonth: 1, isFixedAmount: true, fixedAmount: 2500, lastPaidAmount: 2500, category: 'fatura', currency: 'TRY', isActive: true, icon: '🏢', history: [{ id: 'fbp-1', amount: 2500, date: new Date().toISOString(), isPaid: true }] },
      { id: 'fbill-2', name: 'İnternet', frequency: 'monthly', dayOfMonth: 10, isFixedAmount: true, fixedAmount: 450, lastPaidAmount: 450, category: 'fatura', currency: 'TRY', isActive: true, icon: '🌐', history: [{ id: 'fbp-2', amount: 450, date: new Date().toISOString(), isPaid: true }] },
    ]));
  }, d);
}

async function preparePage(page) {
  await page.evaluate(() => {
    const s = document.createElement('style');
    s.textContent = '::-webkit-scrollbar{display:none!important}*{cursor:none!important;scrollbar-width:none!important}';
    document.head.appendChild(s);
    document.activeElement?.blur();
    document.querySelectorAll('[class*="modal-overlay"],[class*="cookie"],[class*="banner"]').forEach(e => e.remove());
  });
}

async function smartWait(page) {
  try { await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }); } catch {}
  try { await page.evaluate(() => document.fonts?.ready); } catch {}
  await new Promise(r => setTimeout(r, 1200));
}

// ─── Screenshot Pozisyonları ───
async function navigateToPosition(page, pos, lang) {
  switch (pos) {
    case 1: // Anasayfa Klasik
      await page.evaluate(() => localStorage.setItem('kredi-pusula-simple-mode', JSON.stringify(false)));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      break;
    case 2: // Altın pencereli takvim — analytics sayfası, Takvim tab'ına tıkla
      await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await smartWait(page);
      // "Takvim" tab'ına tıkla (all languages)
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="tab"]'));
        const takvim = buttons.find(b => {
          const t = (b.textContent || '').trim().toLowerCase();
          return t === 'takvim' || t === 'calendar' || t === 'التقويم' || t === 'календарь' || t === 'календар';
        });
        if (takvim) takvim.click();
      });
      await new Promise(r => setTimeout(r, 1000));
      await smartWait(page);
      break;
    case 3: // Analitik
      await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      break;
    case 4: // Yatırım Portföyü
      await page.goto(`${BASE_URL}/investments`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      break;
    case 5: // Emlak ve Araçlar
      await page.goto(`${BASE_URL}/assets`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      break;
    case 6: // Takla simülatörü — ana sayfada dialog
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await smartWait(page);
      // QuickActions'daki borç çevirme butonuna tıkla — i18n translations:
      // tr: "Takla Simülatörü", en: "Balance Transfer Simulator", ar: "محاكي تحويل الديون"
      // ru: "Симулятор перевода долга", uk: "Симулятор перекидання боргу"
      await page.evaluate(() => {
        const allEls = Array.from(document.querySelectorAll('button, [role="button"], a, div[class*="cursor"]'));
        const sim = allEls.find(el => {
          const t = (el.textContent || '').toLowerCase();
          return t.includes('takla') || t.includes('balance transfer') || t.includes('debt roll') ||
                 t.includes('تحويل الديون') || t.includes('محاكي') ||
                 t.includes('перевод') || t.includes('перекидання') || t.includes('borç çevir');
        });
        if (sim) sim.click();
      });
      await new Promise(r => setTimeout(r, 1500));
      // Eğer dialog açılmadıysa scroll ile QuickActions'ı bul
      await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) {
          // Scroll down to find QuickActions
          window.scrollBy(0, 600);
        }
      });
      await new Promise(r => setTimeout(r, 500));
      break;
    case 7: // Kartlar
      await page.goto(`${BASE_URL}/wallet?tab=kartlar`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      break;
    case 8: // Bildirimler
      await page.goto(`${BASE_URL}/notification-inbox`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      break;
    case 9: // Aile
      await page.goto(`${BASE_URL}/family`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      break;
    case 10: // Basit mod
      await page.evaluate(() => localStorage.setItem('kredi-pusula-simple-mode', JSON.stringify(true)));
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      break;
  }

  if (lang === 'ar') {
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });
  }

  await smartWait(page);
  await preparePage(page);
}

// ─── Mockup ───
async function createMockup(rawPath, outputPath, pos, lang, device) {
  const hl = (HEADLINES[lang] || HEADLINES.tr)[pos];
  const grad = GRADIENTS[pos];
  const dev = IOS_DEVICES[device];
  const { mockW, mockH } = dev;
  const isIPad = device.includes('ipad');
  const isMac = device === 'mac';

  const rawBuf = await sharp(rawPath).resize(dev.width * dev.scale, dev.height * dev.scale, { fit: 'cover' }).png().toBuffer();
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fontStack = 'system-ui, -apple-system, sans-serif';
  const titleLines = hl.title.split('\n');

  let svg, screenBuf, screenX, screenY;

  if (isMac) {
    // ─── Mac (landscape) mockup ───
    const screenW = Math.round(mockW * 0.82);
    const screenH = Math.round((dev.height * dev.scale) * (screenW / (dev.width * dev.scale)));
    screenX = Math.round((mockW - screenW) / 2);
    screenY = mockH - screenH - Math.round(mockH * 0.06);
    screenBuf = await sharp(rawBuf).resize(screenW, screenH, { fit: 'cover' }).png().toBuffer();

    const maxLineLen = Math.max(...titleLines.map(l => l.length));
    const baseTitleSize = 72;
    const titleSize = maxLineLen > 18 ? Math.round(baseTitleSize * 0.72) :
                      maxLineLen > 14 ? Math.round(baseTitleSize * 0.82) : baseTitleSize;
    const subSize = hl.sub.length > 40 ? 28 : hl.sub.length > 30 ? 32 : 36;

    const titleY = Math.round(mockH * 0.04);
    const titleSVG = titleLines.map((l, i) =>
      `<text x="${mockW/2}" y="${titleY + (i+1)*(titleSize*1.2)}" text-anchor="middle" font-family="${fontStack}" font-size="${titleSize}" font-weight="900" fill="white" letter-spacing="-0.02em">${esc(l)}</text>`
    ).join('');
    const subY = titleY + titleLines.length * (titleSize * 1.2) + subSize * 1.5;

    // Mac frame: simple bezel with rounded corners (like a display)
    const bezel = 6;
    const cornerR = 10;

    svg = `<svg width="${mockW}" height="${mockH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${grad[0]}"/>
          <stop offset="50%" stop-color="${grad[1]}"/>
          <stop offset="100%" stop-color="${grad[2]}"/>
        </linearGradient>
        <filter id="sh"><feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="rgba(0,0,0,0.25)"/></filter>
      </defs>
      <rect width="${mockW}" height="${mockH}" fill="url(#bg)"/>
      ${titleSVG}
      <text x="${mockW/2}" y="${subY}" text-anchor="middle" font-family="${fontStack}" font-size="${subSize}" font-weight="600" fill="rgba(255,255,255,0.85)">${esc(hl.sub)}</text>
      <rect x="${screenX-bezel}" y="${screenY-bezel}" width="${screenW+bezel*2}" height="${screenH+bezel*2}" rx="${cornerR+bezel}" fill="#1a1a1a" filter="url(#sh)"/>
      <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="${cornerR}" fill="white"/>
    </svg>`;
  } else {
    // ─── iPhone / iPad (portrait) mockup ───
    const phoneW = Math.round(mockW * 0.78);
    const phoneH = Math.round((dev.height * dev.scale) * (phoneW / (dev.width * dev.scale)));
    screenX = Math.round((mockW - phoneW) / 2);
    screenY = mockH - phoneH - Math.round(mockH * 0.04);
    screenBuf = await sharp(rawBuf).resize(phoneW, phoneH, { fit: 'cover' }).png().toBuffer();

    const cornerR = isIPad ? 36 : 55;
    const bezel = isIPad ? 8 : 4;

    const maxLineLen = Math.max(...titleLines.map(l => l.length));
    const baseTitleSize = isIPad ? 80 : 72;
    const titleSize = maxLineLen > 18 ? Math.round(baseTitleSize * 0.72) :
                      maxLineLen > 14 ? Math.round(baseTitleSize * 0.82) : baseTitleSize;
    const baseSubSize = isIPad ? 40 : 36;
    const subLen = hl.sub.length;
    const subSize = subLen > 40 ? Math.round(baseSubSize * 0.75) :
                    subLen > 30 ? Math.round(baseSubSize * 0.85) : baseSubSize;

    const titleY = Math.round(mockH * 0.06);
    const titleSVG = titleLines.map((l, i) =>
      `<text x="${mockW/2}" y="${titleY + (i+1)*(titleSize*1.2)}" text-anchor="middle" font-family="${fontStack}" font-size="${titleSize}" font-weight="900" fill="white" letter-spacing="-0.02em">${esc(l)}</text>`
    ).join('');
    const subY = titleY + titleLines.length * (titleSize * 1.2) + subSize * 1.5;

    svg = `<svg width="${mockW}" height="${mockH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${grad[0]}"/>
          <stop offset="50%" stop-color="${grad[1]}"/>
          <stop offset="100%" stop-color="${grad[2]}"/>
        </linearGradient>
        <filter id="sh"><feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="rgba(0,0,0,0.3)"/></filter>
      </defs>
      <rect width="${mockW}" height="${mockH}" fill="url(#bg)"/>
      ${titleSVG}
      <text x="${mockW/2}" y="${subY}" text-anchor="middle" font-family="${fontStack}" font-size="${subSize}" font-weight="600" fill="rgba(255,255,255,0.85)">${esc(hl.sub)}</text>
      <rect x="${screenX-bezel}" y="${screenY-bezel}" width="${phoneW+bezel*2}" height="${phoneH+bezel*2}" rx="${cornerR+bezel}" fill="#1a1a1a" filter="url(#sh)"/>
      <rect x="${screenX}" y="${screenY}" width="${phoneW}" height="${phoneH}" rx="${cornerR}" fill="white"/>
    </svg>`;
  }

  const bgBuf = await sharp(Buffer.from(svg)).resize(mockW, mockH).png().toBuffer();
  const final = await sharp(bgBuf)
    .composite([{ input: screenBuf, top: screenY, left: screenX }])
    .flatten({ background: grad[0] })
    .png({ quality: 90 })
    .toBuffer();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, final);

  // Boyut kontrolü
  const meta = await sharp(outputPath).metadata();
  if (meta.width !== mockW || meta.height !== mockH) {
    const fixed = await sharp(outputPath).resize(mockW, mockH, { fit: 'fill' }).png().toBuffer();
    fs.writeFileSync(outputPath, fixed);
  }
}

// ─── Capture single screenshot with retry ───
async function capturePosition(browser, deviceName, deviceConfig, lang, pos, results) {
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let page;
    try {
      page = await browser.newPage();
      await page.setViewport({
        width: deviceConfig.width,
        height: deviceConfig.height,
        deviceScaleFactor: deviceConfig.scale,
      });

      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await injectDemoData(page, lang);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
      await smartWait(page);

      await navigateToPosition(page, pos, lang);
      await new Promise(r => setTimeout(r, 500));

      const rawDir = path.join(SCREENSHOTS_DIR, 'raw', lang, deviceName);
      fs.mkdirSync(rawDir, { recursive: true });
      const rawPath = path.join(rawDir, `pos${pos}.png`);
      await page.screenshot({ path: rawPath, fullPage: false });

      const mockupDir = path.join(SCREENSHOTS_DIR, 'mockups', lang, deviceName);
      const mockupPath = path.join(mockupDir, `pos${pos}.png`);
      await createMockup(rawPath, mockupPath, pos, lang, deviceName);

      results.success++;
      process.stdout.write('OK ');

      await page.close();
      return;
    } catch (err) {
      try { if (page) await page.close(); } catch {}
      if (attempt === MAX_RETRIES) {
        process.stdout.write('FAIL ');
        results.failed++;
        results.errors.push(`${lang}/${deviceName}/pos${pos}: ${err.message}`);
      } else {
        process.stdout.write(`R${attempt+1} `);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}

// ─── MAIN ───
async function main() {
  console.log('=== Kredy Screenshot Pipeline v2 ===');
  console.log(`5 dil × 10 ekran × 3 iOS cihaz = 150 screenshot\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
           '--disable-gpu', '--font-render-hinting=none',
           '--disable-features=TranslateUI', '--disable-extensions'],
    defaultViewport: null,
  });

  const results = { success: 0, failed: 0, errors: [] };

  for (const lang of LANGUAGES) {
    console.log(`--- ${lang.toUpperCase()} ---`);

    for (const [deviceName, deviceConfig] of Object.entries(IOS_DEVICES)) {
      console.log(`  ${deviceName}`);

      for (let pos = 1; pos <= 10; pos++) {
        process.stdout.write(`    pos${pos}..`);
        await capturePosition(browser, deviceName, deviceConfig, lang, pos, results);
      }
      console.log('');
    }

    // Raw temizle
    const rawLangDir = path.join(SCREENSHOTS_DIR, 'raw', lang);
    if (fs.existsSync(rawLangDir)) fs.rmSync(rawLangDir, { recursive: true });
  }

  await browser.close();

  console.log(`\n=== SONUÇ ===`);
  console.log(`Başarılı: ${results.success} / Başarısız: ${results.failed}`);
  if (results.errors.length) {
    console.log('Hatalar:');
    results.errors.forEach(e => console.log(`  - ${e}`));
  }

  // Doğrulama
  let missing = 0;
  for (const lang of LANGUAGES) {
    for (const dev of Object.keys(IOS_DEVICES)) {
      for (let pos = 1; pos <= 10; pos++) {
        const f = path.join(SCREENSHOTS_DIR, 'mockups', lang, dev, `pos${pos}.png`);
        if (!fs.existsSync(f)) { console.log(`EKSİK: ${lang}/${dev}/pos${pos}`); missing++; }
      }
    }
  }
  console.log(missing === 0 ? 'Tüm 150 dosya mevcut!' : `${missing} dosya eksik!`);
}

main().catch(console.error);
