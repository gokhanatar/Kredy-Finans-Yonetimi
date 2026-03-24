import { describe, it, expect } from "vitest";
import {
  calculateTieredInterestRate,
  calculateEffectiveInterestRate,
  calculateMinimumPayment,
  calculateGoldenWindow,
  getInstallmentLimit,
} from "@/lib/financeUtils";
import { CreditCard, FINANCIAL_CONSTANTS } from "@/types/finance";

describe("calculateTieredInterestRate", () => {
  it("returns under-30K contractual rate for small debt", () => {
    const rate = calculateTieredInterestRate(10000);
    expect(rate).toBe(FINANCIAL_CONSTANTS.TIERED_INTEREST_RATES.UNDER_30K.contractual);
  });

  it("returns 30K-180K rate for medium debt", () => {
    const rate = calculateTieredInterestRate(100000);
    expect(rate).toBe(FINANCIAL_CONSTANTS.TIERED_INTEREST_RATES.BETWEEN_30K_180K.contractual);
  });

  it("returns over-180K rate for large debt", () => {
    const rate = calculateTieredInterestRate(200000);
    expect(rate).toBe(FINANCIAL_CONSTANTS.TIERED_INTEREST_RATES.OVER_180K.contractual);
  });

  it("returns late rate when isLate is true", () => {
    const rate = calculateTieredInterestRate(10000, true);
    expect(rate).toBe(FINANCIAL_CONSTANTS.TIERED_INTEREST_RATES.UNDER_30K.late);
  });
});

describe("calculateEffectiveInterestRate", () => {
  it("applies KKDF and BSMV correctly", () => {
    const baseRate = 3.25;
    const effectiveRate = calculateEffectiveInterestRate(baseRate);
    const expectedMultiplier = 1 + (FINANCIAL_CONSTANTS.KKDF_RATE / 100) + (FINANCIAL_CONSTANTS.BSMV_RATE / 100);
    expect(effectiveRate).toBeCloseTo(baseRate * expectedMultiplier, 2);
  });

  it("returns 0 for 0 base rate", () => {
    expect(calculateEffectiveInterestRate(0)).toBe(0);
  });
});

describe("calculateMinimumPayment", () => {
  it("returns 40% for high-limit cards", () => {
    const card: CreditCard = {
      id: "1",
      bankName: "Test",
      cardName: "Test",
      lastFourDigits: "1234",
      cardType: "bireysel",
      limit: 60000,
      currentDebt: 20000,
      availableLimit: 40000,
      minimumPayment: 0,
      statementDate: 15,
      dueDate: 25,
      interestRate: 3.25,
      color: "blue",
    };
    const minPayment = calculateMinimumPayment(card);
    expect(minPayment).toBeCloseTo(20000 * 0.4, 0);
  });

  it("returns 20% for low-limit cards", () => {
    const card: CreditCard = {
      id: "2",
      bankName: "Test",
      cardName: "Test",
      lastFourDigits: "5678",
      cardType: "bireysel",
      limit: 30000,
      currentDebt: 10000,
      availableLimit: 20000,
      minimumPayment: 0,
      statementDate: 15,
      dueDate: 25,
      interestRate: 3.25,
      color: "blue",
    };
    const minPayment = calculateMinimumPayment(card);
    expect(minPayment).toBeCloseTo(10000 * 0.2, 0);
  });
});

describe("calculateGoldenWindow", () => {
  const makeCard = (statementDate: number): CreditCard => ({
    id: "1",
    bankName: "Test",
    cardName: "Test",
    lastFourDigits: "1234",
    cardType: "bireysel",
    limit: 50000,
    currentDebt: 10000,
    availableLimit: 40000,
    minimumPayment: 0,
    statementDate,
    dueDate: 25,
    interestRate: 3.25,
    color: "blue",
  });

  it("returns golden window cards sorted by opportunity", () => {
    const today = new Date();
    const statementDate = today.getDate() - 2; // 2 days ago
    const cards = [makeCard(statementDate > 0 ? statementDate : 28)];
    const result = calculateGoldenWindow(cards);
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
  });

  it("returns 5 stars on day 1 after statement (best day)", () => {
    const today = new Date();
    let statementDate = today.getDate() - 1;
    if (statementDate <= 0) statementDate += 30;
    const cards = [makeCard(statementDate)];
    const result = calculateGoldenWindow(cards);
    expect(result[0].isGoldenWindow).toBe(true);
    expect(result[0].goldenRating).toBe(5);
    expect(result[0].goldenDaysRemaining).toBe(5);
  });

  it("returns 3 stars on day 3 after statement", () => {
    const today = new Date();
    let statementDate = today.getDate() - 3;
    if (statementDate <= 0) statementDate += 30;
    const cards = [makeCard(statementDate)];
    const result = calculateGoldenWindow(cards);
    expect(result[0].isGoldenWindow).toBe(true);
    expect(result[0].goldenRating).toBe(3);
    expect(result[0].goldenDaysRemaining).toBe(3);
  });

  it("returns 1 star on day 5 (last day)", () => {
    const today = new Date();
    let statementDate = today.getDate() - 5;
    if (statementDate <= 0) statementDate += 30;
    const cards = [makeCard(statementDate)];
    const result = calculateGoldenWindow(cards);
    expect(result[0].isGoldenWindow).toBe(true);
    expect(result[0].goldenRating).toBe(1);
    expect(result[0].goldenDaysRemaining).toBe(1);
  });

  it("returns 0 stars when outside golden window", () => {
    const today = new Date();
    let statementDate = today.getDate() - 10;
    if (statementDate <= 0) statementDate += 30;
    const cards = [makeCard(statementDate)];
    const result = calculateGoldenWindow(cards);
    expect(result[0].isGoldenWindow).toBe(false);
    expect(result[0].goldenRating).toBe(0);
    expect(result[0].goldenDaysRemaining).toBe(0);
  });

  it("sorts cards with higher star rating first", () => {
    const today = new Date();
    let sd1 = today.getDate() - 4; // 4 days ago → 2 stars
    let sd2 = today.getDate() - 1; // 1 day ago → 5 stars
    if (sd1 <= 0) sd1 += 30;
    if (sd2 <= 0) sd2 += 30;
    const card1 = { ...makeCard(sd1), id: "a" };
    const card2 = { ...makeCard(sd2), id: "b" };
    const result = calculateGoldenWindow([card1, card2]);
    expect(result[0].card.id).toBe("b"); // 5 stars first
    expect(result[1].card.id).toBe("a"); // 2 stars second
  });
});

describe("getInstallmentLimit", () => {
  it("returns 0 maxInstallments for prohibited categories (gida)", () => {
    const result = getInstallmentLimit("gida", "bireysel");
    expect(result.maxInstallments).toBe(0);
  });

  it("returns 0 maxInstallments for akaryakit", () => {
    const result = getInstallmentLimit("akaryakit", "bireysel");
    expect(result.maxInstallments).toBe(0);
  });

  it("returns positive maxInstallments for allowed categories", () => {
    const result = getInstallmentLimit("saglik", "bireysel");
    expect(result.maxInstallments).toBeGreaterThan(0);
  });
});
