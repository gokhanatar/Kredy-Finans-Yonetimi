import {
  Property,
  Vehicle,
  Business,
  PropertyTaxResult,
  RentalDeclarationResult,
  VehicleTaxResult,
  DisabledSaleRestrictionResult,
  VehicleSaleFeeResult,
  ASSET_TAX_CONSTANTS,
  VEHICLE_TAX_CONSTANTS,
  BUSINESS_TAX_CONSTANTS,
} from '@/types/assetTypes';
import { 
  addYears, 
  differenceInDays, 
  differenceInYears, 
  startOfDay, 
  setDate, 
  setMonth, 
  addMonths,
  isBefore,
  isAfter,
} from 'date-fns';

// ============= EMLAK VERGİSİ HESAPLAMALARI =============

/**
 * 2026 emlak vergi değeri tavanını hesaplar
 * Kural: 2026 değeri, 2025 değerinin iki kat fazlasını (toplam 3 katını) geçemez
 */
export function calculate2026PropertyValue(value2025: number, actualValue2026?: number): number {
  const maxValue = value2025 * ASSET_TAX_CONSTANTS.MAX_VALUE_INCREASE_MULTIPLIER;
  
  if (actualValue2026) {
    return Math.min(actualValue2026, maxValue);
  }
  
  return maxValue;
}

/**
 * Emlak vergisi muafiyet kontrolü yapar
 */
export function checkPropertyExemption(property: Property): { isExempt: boolean; reason?: string } {
  // Emekli, tek ev sahibi ve 200m² altı için muafiyet
  if (
    property.type === 'konut' &&
    property.isRetired &&
    property.isSingleProperty &&
    !property.hasOtherIncome &&
    property.sqMeters &&
    property.sqMeters < ASSET_TAX_CONSTANTS.EXEMPTION.MAX_SQ_METERS
  ) {
    return {
      isExempt: true,
      reason: 'Emekli, tek konut sahibi ve 200m² altı - Emlak vergisi muafiyeti',
    };
  }
  
  return { isExempt: false };
}

/**
 * Emlak vergisi hesaplama
 */
export function calculatePropertyTax(property: Property): PropertyTaxResult {
  const exemption = checkPropertyExemption(property);
  
  if (exemption.isExempt) {
    return {
      annualTax: 0,
      installment1: 0,
      installment2: 0,
      isExempt: true,
      exemptReason: exemption.reason,
      value2026: property.currentValue,
      taxRate: 0,
    };
  }
  
  // Vergi oranı (binde)
  const taxRates = ASSET_TAX_CONSTANTS.PROPERTY_TAX_RATES[property.type];
  const taxRate = taxRates[property.location]; // binde cinsinden
  
  // Yıllık vergi = Değer * (Oran / 1000)
  const annualTax = property.currentValue * (taxRate / 1000);
  const installmentAmount = annualTax / 2;
  
  return {
    annualTax,
    installment1: installmentAmount,
    installment2: installmentAmount,
    isExempt: false,
    value2026: property.currentValue,
    taxRate,
  };
}

/**
 * Değerli konut vergisi kontrolü
 */
export function checkLuxuryPropertyTax(property: Property): { 
  isSubject: boolean; 
  threshold: number;
  declarationDate: Date;
} {
  const threshold = ASSET_TAX_CONSTANTS.LUXURY_PROPERTY_THRESHOLD;
  const { month, day } = ASSET_TAX_CONSTANTS.LUXURY_PROPERTY_DECLARATION_DATE;
  
  const currentYear = new Date().getFullYear();
  const declarationDate = new Date(currentYear, month - 1, day);
  
  return {
    isSubject: property.type === 'konut' && property.currentValue >= threshold,
    threshold,
    declarationDate,
  };
}

// ============= KİRA GELİRİ HESAPLAMALARI =============

/**
 * Kira beyanı gereklilik kontrolü
 */
export function checkRentalDeclaration(
  annualIncome: number, 
  propertyType: 'konut' | 'isyeri'
): RentalDeclarationResult {
  const { RENTAL_INCOME } = ASSET_TAX_CONSTANTS;
  const exemptAmount = propertyType === 'konut' 
    ? RENTAL_INCOME.EXEMPT_AMOUNT_KONUT 
    : RENTAL_INCOME.EXEMPT_AMOUNT_ISYERI;
  
  const currentYear = new Date().getFullYear();
  const declarationDeadline = new Date(currentYear, RENTAL_INCOME.DECLARATION_MONTH - 1, 31);
  
  const taxableAmount = Math.max(0, annualIncome - exemptAmount);
  const required = annualIncome > exemptAmount;
  
  return {
    required,
    exemptAmount,
    taxableAmount,
    declarationDeadline,
    warning: propertyType === 'konut' && required 
      ? RENTAL_INCOME.INTEREST_DEDUCTION_WARNING 
      : undefined,
  };
}

// ============= EMLAK VERGİSİ TARİH HESAPLAMALARI =============

/**
 * Sonraki emlak vergisi taksit tarihini hesaplar
 */
export function calculateNextPropertyTaxDate(): { 
  date: Date; 
  installment: 1 | 2; 
  daysRemaining: number;
  isWithinPaymentPeriod: boolean;
} {
  const today = startOfDay(new Date());
  const currentYear = today.getFullYear();
  const { FIRST_INSTALLMENT, SECOND_INSTALLMENT } = ASSET_TAX_CONSTANTS.PROPERTY_TAX_DEADLINES;
  
  // 1. Taksit: 1 Mart - 31 Mayıs
  const firstStart = new Date(currentYear, FIRST_INSTALLMENT.startMonth - 1, FIRST_INSTALLMENT.startDay);
  const firstEnd = new Date(currentYear, FIRST_INSTALLMENT.endMonth - 1, FIRST_INSTALLMENT.endDay);
  
  // 2. Taksit: 1 Kasım - 30 Kasım
  const secondStart = new Date(currentYear, SECOND_INSTALLMENT.startMonth - 1, SECOND_INSTALLMENT.startDay);
  const secondEnd = new Date(currentYear, SECOND_INSTALLMENT.endMonth - 1, SECOND_INSTALLMENT.endDay);
  
  // Hangi dönemde olduğumuzu belirle
  if (isBefore(today, firstStart)) {
    return {
      date: firstEnd,
      installment: 1,
      daysRemaining: differenceInDays(firstEnd, today),
      isWithinPaymentPeriod: false,
    };
  } else if (isBefore(today, firstEnd) || today.getTime() === firstEnd.getTime()) {
    return {
      date: firstEnd,
      installment: 1,
      daysRemaining: differenceInDays(firstEnd, today),
      isWithinPaymentPeriod: true,
    };
  } else if (isBefore(today, secondStart)) {
    return {
      date: secondEnd,
      installment: 2,
      daysRemaining: differenceInDays(secondEnd, today),
      isWithinPaymentPeriod: false,
    };
  } else if (isBefore(today, secondEnd) || today.getTime() === secondEnd.getTime()) {
    return {
      date: secondEnd,
      installment: 2,
      daysRemaining: differenceInDays(secondEnd, today),
      isWithinPaymentPeriod: true,
    };
  } else {
    // Sonraki yılın 1. taksiti
    const nextYearFirstEnd = new Date(currentYear + 1, FIRST_INSTALLMENT.endMonth - 1, FIRST_INSTALLMENT.endDay);
    return {
      date: nextYearFirstEnd,
      installment: 1,
      daysRemaining: differenceInDays(nextYearFirstEnd, today),
      isWithinPaymentPeriod: false,
    };
  }
}

// ============= MTV HESAPLAMALARI =============

/**
 * Sonraki MTV taksit tarihini hesaplar
 */
export function calculateNextMTVDate(): { 
  date: Date; 
  installment: 1 | 2; 
  daysRemaining: number;
} {
  const today = startOfDay(new Date());
  const currentYear = today.getFullYear();
  const { FIRST_INSTALLMENT, SECOND_INSTALLMENT } = VEHICLE_TAX_CONSTANTS.MTV_DEADLINES;
  
  // 1. Taksit: 31 Ocak (hafta sonuna denk gelirse bir sonraki iş günü)
  let firstDate = new Date(currentYear, FIRST_INSTALLMENT.month - 1, FIRST_INSTALLMENT.day);
  // 2026'da 31 Ocak Cumartesi, son gün 2 Şubat Pazartesi
  if (firstDate.getDay() === 6) firstDate = addMonths(firstDate, 0); // Pazartesi'ye ayarla
  if (firstDate.getDay() === 0) firstDate.setDate(firstDate.getDate() + 1);
  
  // 2. Taksit: 31 Temmuz
  const secondDate = new Date(currentYear, SECOND_INSTALLMENT.month - 1, SECOND_INSTALLMENT.day);
  
  if (isBefore(today, firstDate) || today.getTime() === firstDate.getTime()) {
    return {
      date: firstDate,
      installment: 1,
      daysRemaining: differenceInDays(firstDate, today),
    };
  } else if (isBefore(today, secondDate) || today.getTime() === secondDate.getTime()) {
    return {
      date: secondDate,
      installment: 2,
      daysRemaining: differenceInDays(secondDate, today),
    };
  } else {
    // Sonraki yılın 1. taksiti
    const nextYearFirst = new Date(currentYear + 1, FIRST_INSTALLMENT.month - 1, FIRST_INSTALLMENT.day);
    return {
      date: nextYearFirst,
      installment: 1,
      daysRemaining: differenceInDays(nextYearFirst, today),
    };
  }
}

// ============= ARAÇ MUAYENE HESAPLAMALARI =============

/**
 * Sonraki araç muayene tarihini hesaplar
 */
export function calculateNextInspectionDate(vehicle: Vehicle): Date {
  const registrationDate = new Date(vehicle.registrationDate);
  const today = startOfDay(new Date());
  const vehicleAge = differenceInYears(today, registrationDate);
  
  const { INSPECTION_PERIODS } = VEHICLE_TAX_CONSTANTS;
  
  let inspectionPeriod: number;
  
  if (vehicle.vehicleType === 'ticari') {
    inspectionPeriod = INSPECTION_PERIODS.TICARI; // Her yıl
  } else {
    // Otomobil veya motosiklet
    if (vehicleAge < 3) {
      // İlk 3 yıl muayene yok, 3. yılın sonunda ilk muayene
      return addYears(registrationDate, INSPECTION_PERIODS.OTOMOBIL_FIRST);
    } else {
      inspectionPeriod = INSPECTION_PERIODS.OTOMOBIL_AFTER; // 2 yılda bir
    }
  }
  
  // Son muayene tarihinden sonraki muayene tarihi
  if (vehicle.lastInspectionDate) {
    const lastInspection = new Date(vehicle.lastInspectionDate);
    return addYears(lastInspection, inspectionPeriod);
  }
  
  // Son muayene tarihi yoksa tescil tarihinden hesapla
  if (vehicle.vehicleType === 'ticari') {
    // Ticari araç: Her yıl
    let nextInspection = addYears(registrationDate, 1);
    while (isBefore(nextInspection, today)) {
      nextInspection = addYears(nextInspection, 1);
    }
    return nextInspection;
  } else {
    // Otomobil/Motosiklet: 3 yıl sonra, sonra 2 yılda bir
    let nextInspection = addYears(registrationDate, 3);
    while (isBefore(nextInspection, today)) {
      nextInspection = addYears(nextInspection, 2);
    }
    return nextInspection;
  }
}

/**
 * Muayene durumu kontrolü
 */
export function checkInspectionStatus(vehicle: Vehicle): {
  nextDate: Date;
  daysRemaining: number;
  isOverdue: boolean;
  isWarning: boolean;
  warningMessage?: string;
} {
  const nextDate = calculateNextInspectionDate(vehicle);
  const today = startOfDay(new Date());
  const daysRemaining = differenceInDays(nextDate, today);
  const isOverdue = daysRemaining < 0;
  const isWarning = daysRemaining <= VEHICLE_TAX_CONSTANTS.INSPECTION_WARNINGS.DAYS_BEFORE_WARNING && daysRemaining >= 0;
  
  let warningMessage: string | undefined;
  if (isOverdue) {
    warningMessage = `⛔ Araç muayenesi ${Math.abs(daysRemaining)} gün geçmiş!`;
  } else if (isWarning) {
    warningMessage = `⚠️ ${VEHICLE_TAX_CONSTANTS.INSPECTION_WARNINGS.MTV_DEBT_WARNING}`;
  }
  
  return {
    nextDate,
    daysRemaining,
    isOverdue,
    isWarning,
    warningMessage,
  };
}

// ============= ENGELLİ ARAÇ SATIŞ YASAĞI =============

/**
 * Engelli araç satış yasağı kontrolü
 */
export function checkDisabledSaleRestriction(vehicle: Vehicle): DisabledSaleRestrictionResult {
  if (!vehicle.isDisabledExempt || !vehicle.disabledExemptDate) {
    return {
      isBanned: false,
      banEndDate: new Date(),
      yearsRemaining: 0,
    };
  }
  
  const exemptDate = new Date(vehicle.disabledExemptDate);
  const banStartDate = VEHICLE_TAX_CONSTANTS.DISABLED_VEHICLE.BAN_START_DATE;
  
  // 2025 sonrası alınan araçlar için 10 yıl yasak
  const banYears = isAfter(exemptDate, banStartDate) || exemptDate.getTime() === banStartDate.getTime()
    ? VEHICLE_TAX_CONSTANTS.DISABLED_VEHICLE.SALE_BAN_YEARS 
    : 5; // 2025 öncesi 5 yıl
  
  const banEndDate = addYears(exemptDate, banYears);
  const today = startOfDay(new Date());
  const yearsRemaining = differenceInYears(banEndDate, today);
  const isBanned = isBefore(today, banEndDate);
  
  return {
    isBanned,
    banEndDate,
    yearsRemaining: Math.max(0, yearsRemaining),
    penalty: isBanned 
      ? `Aracınızı satarsanız ÖTV ödemek zorundasınız! (${yearsRemaining} yıl kaldı)` 
      : undefined,
  };
}

// ============= ARAÇ SATIŞ HARCI =============

/**
 * Araç satış noter harcı hesaplama (2026)
 */
export function calculateVehicleSaleFee(saleValue: number): VehicleSaleFeeResult {
  const { SALE_NOTARY_FEE_RATE, SALE_NOTARY_FEE_MIN } = VEHICLE_TAX_CONSTANTS;
  
  // Binde 2 oranında harç
  const calculatedFee = saleValue * (SALE_NOTARY_FEE_RATE / 1000);
  
  // Minimum 1.000 TL
  const notaryFee = Math.max(calculatedFee, SALE_NOTARY_FEE_MIN);
  
  return {
    notaryFee,
    totalFee: notaryFee,
  };
}

// ============= İŞ YERİ VERGİ HESAPLAMALARI =============

/**
 * Yıllık harç gerekli mi kontrolü
 */
export function checkAnnualFeeRequired(business: Business): boolean {
  return BUSINESS_TAX_CONSTANTS.ANNUAL_FEE_PROFESSIONS.includes(business.profession);
}

/**
 * 4. Dönem geçici vergi tarihini hesaplar
 */
export function calculateQuarterlyTax4thPeriodDate(): Date {
  const currentYear = new Date().getFullYear();
  // Şubat ayında beyan
  return new Date(currentYear, BUSINESS_TAX_CONSTANTS.QUARTERLY_TAX_4TH_PERIOD.month - 1, 17);
}

// ============= YARDIMCI FONKSİYONLAR =============

/**
 * Para birimi formatla
 */
export function formatAssetCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Tarih formatla
 */
export function formatAssetDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
