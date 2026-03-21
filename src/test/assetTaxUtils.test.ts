import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculate2026PropertyValue,
  checkPropertyExemption,
  calculatePropertyTax,
  checkLuxuryPropertyTax,
  checkRentalDeclaration,
  calculateNextPropertyTaxDate,
  calculateNextMTVDate,
  calculateNextInspectionDate,
  checkInspectionStatus,
  checkDisabledSaleRestriction,
  calculateVehicleSaleFee,
  checkAnnualFeeRequired,
  calculateQuarterlyTax4thPeriodDate,
  formatAssetCurrency,
  formatAssetDate,
} from "@/lib/assetTaxUtils";
import {
  Property,
  Vehicle,
  Business,
  ASSET_TAX_CONSTANTS,
  VEHICLE_TAX_CONSTANTS,
} from "@/types/assetTypes";

// ============= EMLAK VERGİSİ =============

describe("calculate2026PropertyValue", () => {
  it("returns max 3x of 2025 value when no actual value given", () => {
    expect(calculate2026PropertyValue(100000)).toBe(300000);
  });

  it("returns actual value when below cap", () => {
    expect(calculate2026PropertyValue(100000, 200000)).toBe(200000);
  });

  it("caps value at 3x when actual exceeds limit", () => {
    expect(calculate2026PropertyValue(100000, 500000)).toBe(300000);
  });

  it("returns exactly 3x when actual equals cap", () => {
    expect(calculate2026PropertyValue(100000, 300000)).toBe(300000);
  });
});

describe("checkPropertyExemption", () => {
  const makeProperty = (overrides: Partial<Property> = {}): Property => ({
    id: "1",
    name: "Test Daire",
    type: "konut",
    location: "buyuksehir",
    valuePreviousYear: 500000,
    currentValue: 1000000,
    sqMeters: 150,
    isRented: false,
    isRetired: true,
    isSingleProperty: true,
    hasOtherIncome: false,
    createdAt: new Date(),
    ...overrides,
  });

  it("grants exemption for retired, single property, under 200m²", () => {
    const result = checkPropertyExemption(makeProperty());
    expect(result.isExempt).toBe(true);
    expect(result.reason).toContain("muafiyet");
  });

  it("denies exemption for non-retired owner", () => {
    const result = checkPropertyExemption(makeProperty({ isRetired: false }));
    expect(result.isExempt).toBe(false);
  });

  it("denies exemption for multiple property owner", () => {
    const result = checkPropertyExemption(
      makeProperty({ isSingleProperty: false })
    );
    expect(result.isExempt).toBe(false);
  });

  it("denies exemption for property over 200m²", () => {
    const result = checkPropertyExemption(makeProperty({ sqMeters: 250 }));
    expect(result.isExempt).toBe(false);
  });

  it("denies exemption for isyeri type", () => {
    const result = checkPropertyExemption(makeProperty({ type: "isyeri" }));
    expect(result.isExempt).toBe(false);
  });

  it("denies exemption when owner has other income", () => {
    const result = checkPropertyExemption(
      makeProperty({ hasOtherIncome: true })
    );
    expect(result.isExempt).toBe(false);
  });
});

describe("calculatePropertyTax", () => {
  const makeProperty = (overrides: Partial<Property> = {}): Property => ({
    id: "1",
    name: "Test",
    type: "konut",
    location: "buyuksehir",
    valuePreviousYear: 500000,
    currentValue: 1000000,
    isRented: false,
    isRetired: false,
    isSingleProperty: false,
    hasOtherIncome: false,
    createdAt: new Date(),
    ...overrides,
  });

  it("calculates konut buyuksehir tax correctly (binde 2)", () => {
    const result = calculatePropertyTax(makeProperty());
    expect(result.annualTax).toBe(1000000 * (2 / 1000));
    expect(result.installment1).toBe(result.annualTax / 2);
    expect(result.installment2).toBe(result.annualTax / 2);
    expect(result.isExempt).toBe(false);
  });

  it("calculates isyeri buyuksehir tax correctly (binde 4)", () => {
    const result = calculatePropertyTax(
      makeProperty({ type: "isyeri", currentValue: 2000000 })
    );
    expect(result.annualTax).toBe(2000000 * (4 / 1000));
  });

  it("calculates arsa diger tax correctly (binde 3)", () => {
    const result = calculatePropertyTax(
      makeProperty({ type: "arsa", location: "diger", currentValue: 500000 })
    );
    expect(result.annualTax).toBe(500000 * (3 / 1000));
  });

  it("returns 0 tax for exempt property", () => {
    const result = calculatePropertyTax(
      makeProperty({
        isRetired: true,
        isSingleProperty: true,
        hasOtherIncome: false,
        sqMeters: 150,
      })
    );
    expect(result.annualTax).toBe(0);
    expect(result.isExempt).toBe(true);
  });
});

describe("checkLuxuryPropertyTax", () => {
  const makeProperty = (overrides: Partial<Property> = {}): Property => ({
    id: "1",
    name: "Test",
    type: "konut",
    location: "buyuksehir",
    valuePreviousYear: 5000000,
    currentValue: 16000000,
    isRented: false,
    isRetired: false,
    isSingleProperty: false,
    hasOtherIncome: false,
    createdAt: new Date(),
    ...overrides,
  });

  it("identifies luxury property above threshold", () => {
    const result = checkLuxuryPropertyTax(makeProperty());
    expect(result.isSubject).toBe(true);
    expect(result.threshold).toBe(ASSET_TAX_CONSTANTS.LUXURY_PROPERTY_THRESHOLD);
  });

  it("excludes property below threshold", () => {
    const result = checkLuxuryPropertyTax(
      makeProperty({ currentValue: 10000000 })
    );
    expect(result.isSubject).toBe(false);
  });

  it("excludes non-konut types even above threshold", () => {
    const result = checkLuxuryPropertyTax(
      makeProperty({ type: "isyeri", currentValue: 20000000 })
    );
    expect(result.isSubject).toBe(false);
  });
});

// ============= KİRA GELİRİ =============

describe("checkRentalDeclaration", () => {
  it("requires declaration when konut income exceeds exempt amount", () => {
    const result = checkRentalDeclaration(100000, "konut");
    expect(result.required).toBe(true);
    expect(result.taxableAmount).toBe(
      100000 - ASSET_TAX_CONSTANTS.RENTAL_INCOME.EXEMPT_AMOUNT_KONUT
    );
    expect(result.warning).toBeDefined();
  });

  it("does not require declaration when konut income is below exempt", () => {
    const result = checkRentalDeclaration(30000, "konut");
    expect(result.required).toBe(false);
    expect(result.taxableAmount).toBe(0);
  });

  it("handles isyeri declaration correctly", () => {
    const result = checkRentalDeclaration(500000, "isyeri");
    expect(result.required).toBe(true);
    expect(result.warning).toBeUndefined();
  });
});

// ============= ARAÇ =============

describe("calculateNextInspectionDate", () => {
  const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
    id: "1",
    name: "Test Car",
    plate: "34ABC123",
    registrationDate: new Date("2020-01-15"),
    isPost2018: true,
    engineCC: 1600,
    vehicleType: "otomobil",
    isDisabledExempt: false,
    createdAt: new Date(),
    ...overrides,
  });

  it("returns 3 years from registration for new car (<3 years old)", () => {
    const recentCar = makeVehicle({
      registrationDate: new Date("2024-06-01"),
    });
    const result = calculateNextInspectionDate(recentCar);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(5); // June
  });

  it("calculates next inspection from last inspection date", () => {
    const car = makeVehicle({
      lastInspectionDate: new Date("2025-03-10"),
    });
    const result = calculateNextInspectionDate(car);
    expect(result.getFullYear()).toBe(2027);
  });

  it("returns yearly inspection for commercial vehicles", () => {
    const ticari = makeVehicle({
      vehicleType: "ticari",
      lastInspectionDate: new Date("2025-06-01"),
    });
    const result = calculateNextInspectionDate(ticari);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
  });
});

describe("checkInspectionStatus", () => {
  it("returns overdue for past inspection date", () => {
    const vehicle: Vehicle = {
      id: "1",
      name: "Old Car",
      plate: "34XYZ",
      registrationDate: new Date("2015-01-01"),
      isPost2018: false,
      engineCC: 1400,
      vehicleType: "otomobil",
      lastInspectionDate: new Date("2022-01-01"),
      isDisabledExempt: false,
      createdAt: new Date(),
    };
    const result = checkInspectionStatus(vehicle);
    expect(result.isOverdue).toBe(true);
    expect(result.daysRemaining).toBeLessThan(0);
    expect(result.warningMessage).toContain("geçmiş");
  });
});

describe("checkDisabledSaleRestriction", () => {
  const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
    id: "1",
    name: "Test",
    plate: "34X",
    registrationDate: new Date(),
    isPost2018: true,
    engineCC: 1600,
    vehicleType: "otomobil",
    isDisabledExempt: false,
    createdAt: new Date(),
    ...overrides,
  });

  it("returns not banned for non-exempt vehicle", () => {
    const result = checkDisabledSaleRestriction(makeVehicle());
    expect(result.isBanned).toBe(false);
    expect(result.yearsRemaining).toBe(0);
  });

  it("returns 10 year ban for post-2025 exempt vehicle", () => {
    const result = checkDisabledSaleRestriction(
      makeVehicle({
        isDisabledExempt: true,
        disabledExemptDate: new Date("2025-06-01"),
      })
    );
    expect(result.isBanned).toBe(true);
    expect(result.penalty).toContain("ÖTV");
  });

  it("returns 5 year ban for pre-2025 exempt vehicle", () => {
    const result = checkDisabledSaleRestriction(
      makeVehicle({
        isDisabledExempt: true,
        disabledExemptDate: new Date("2024-06-01"),
      })
    );
    expect(result.isBanned).toBe(true);
  });
});

describe("calculateVehicleSaleFee", () => {
  it("calculates binde 2 notary fee", () => {
    const result = calculateVehicleSaleFee(500000);
    expect(result.notaryFee).toBe(1000); // 500000 * 2/1000 = 1000
  });

  it("applies minimum fee when calculated is below minimum", () => {
    const result = calculateVehicleSaleFee(100000);
    // 100000 * 2/1000 = 200, min is 1000
    expect(result.notaryFee).toBe(VEHICLE_TAX_CONSTANTS.SALE_NOTARY_FEE_MIN);
  });

  it("uses calculated fee when above minimum", () => {
    const result = calculateVehicleSaleFee(10000000);
    expect(result.notaryFee).toBe(20000); // 10M * 2/1000 = 20000
  });
});

// ============= İŞ YERİ =============

describe("checkAnnualFeeRequired", () => {
  it("returns true for kuyumcu", () => {
    expect(
      checkAnnualFeeRequired({
        id: "1",
        name: "Test",
        profession: "kuyumcu",
        hasAnnualFee: true,
        createdAt: new Date(),
      })
    ).toBe(true);
  });

  it("returns false for diger profession", () => {
    expect(
      checkAnnualFeeRequired({
        id: "1",
        name: "Test",
        profession: "diger",
        hasAnnualFee: false,
        createdAt: new Date(),
      })
    ).toBe(false);
  });
});

// ============= YARDIMCI =============

describe("formatAssetCurrency", () => {
  it("formats as TRY currency", () => {
    const formatted = formatAssetCurrency(1500000);
    expect(formatted).toContain("1.500.000");
  });

  it("formats zero", () => {
    const formatted = formatAssetCurrency(0);
    expect(formatted).toContain("0");
  });
});

describe("formatAssetDate", () => {
  it("formats date in Turkish locale", () => {
    const date = new Date(2026, 2, 15);
    const formatted = formatAssetDate(date);
    expect(formatted).toContain("2026");
    expect(formatted).toContain("15");
  });
});
