import { describe, it, expect } from "vitest";
import {
  Debt,
  calculateSnowball,
  calculateAvalanche,
  compareStrategies,
} from "@/lib/debtStrategy";

const sampleDebts: Debt[] = [
  {
    id: "cc1",
    name: "Kredi Kartı 1",
    balance: 5000,
    interestRate: 3.5, // aylık %3.5
    minimumPayment: 500,
  },
  {
    id: "cc2",
    name: "Kredi Kartı 2",
    balance: 15000,
    interestRate: 2.8,
    minimumPayment: 1000,
  },
  {
    id: "loan1",
    name: "İhtiyaç Kredisi",
    balance: 30000,
    interestRate: 1.5,
    minimumPayment: 2000,
  },
];

describe("calculateSnowball", () => {
  it("returns empty result for no debts", () => {
    const result = calculateSnowball([], 0);
    expect(result.method).toBe("snowball");
    expect(result.totalInterest).toBe(0);
    expect(result.monthsToPayoff).toBe(0);
    expect(result.monthlyPlan).toEqual([]);
    expect(result.payoffOrder).toEqual([]);
  });

  it("pays off smallest balance first", () => {
    const result = calculateSnowball(sampleDebts, 500);
    // cc1 has smallest balance (5000), should be paid off first
    expect(result.payoffOrder[0]).toBe("cc1");
    expect(result.method).toBe("snowball");
  });

  it("eventually pays off all debts", () => {
    const result = calculateSnowball(sampleDebts, 500);
    expect(result.payoffOrder.length).toBe(3);
    expect(result.payoffOrder).toContain("cc1");
    expect(result.payoffOrder).toContain("cc2");
    expect(result.payoffOrder).toContain("loan1");
  });

  it("calculates positive total interest", () => {
    const result = calculateSnowball(sampleDebts, 500);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it("generates monthly plan entries", () => {
    const result = calculateSnowball(sampleDebts, 500);
    expect(result.monthlyPlan.length).toBe(result.monthsToPayoff);
    expect(result.monthlyPlan[0].month).toBe(1);
  });
});

describe("calculateAvalanche", () => {
  it("returns empty result for no debts", () => {
    const result = calculateAvalanche([], 0);
    expect(result.method).toBe("avalanche");
    expect(result.monthsToPayoff).toBe(0);
  });

  it("pays off highest interest rate first", () => {
    const result = calculateAvalanche(sampleDebts, 500);
    // cc1 has highest rate (3.5%), should be paid off first
    expect(result.payoffOrder[0]).toBe("cc1");
  });

  it("results in less total interest than snowball", () => {
    const snowball = calculateSnowball(sampleDebts, 500);
    const avalanche = calculateAvalanche(sampleDebts, 500);
    expect(avalanche.totalInterest).toBeLessThanOrEqual(
      snowball.totalInterest
    );
  });

  it("pays off all debts", () => {
    const result = calculateAvalanche(sampleDebts, 500);
    expect(result.payoffOrder.length).toBe(3);
  });
});

describe("compareStrategies", () => {
  it("returns both strategies with comparison", () => {
    const result = compareStrategies(sampleDebts, 500);
    expect(result.snowball.method).toBe("snowball");
    expect(result.avalanche.method).toBe("avalanche");
    expect(result.interestDifference).toBeGreaterThanOrEqual(0);
  });

  it("recommends a strategy with reason", () => {
    const result = compareStrategies(sampleDebts, 500);
    expect(["snowball", "avalanche"]).toContain(result.recommendation);
    expect(result.recommendationReason.length).toBeGreaterThan(0);
  });

  it("recommends snowball when interest difference is small and few debts", () => {
    // 2 debts with similar rates
    const similarDebts: Debt[] = [
      {
        id: "a",
        name: "A",
        balance: 3000,
        interestRate: 2.0,
        minimumPayment: 500,
      },
      {
        id: "b",
        name: "B",
        balance: 5000,
        interestRate: 2.1,
        minimumPayment: 500,
      },
    ];
    const result = compareStrategies(similarDebts, 500);
    // With very similar rates and few debts, should recommend snowball
    expect(result.recommendation).toBe("snowball");
  });

  it("calculates correct time difference", () => {
    const result = compareStrategies(sampleDebts, 500);
    expect(result.timeDifference).toBe(
      result.snowball.monthsToPayoff - result.avalanche.monthsToPayoff
    );
  });

  it("handles single debt correctly", () => {
    const single: Debt[] = [
      {
        id: "only",
        name: "Tek Borç",
        balance: 10000,
        interestRate: 3.0,
        minimumPayment: 1000,
      },
    ];
    const result = compareStrategies(single, 500);
    // With single debt, both strategies should be identical
    expect(result.snowball.monthsToPayoff).toBe(
      result.avalanche.monthsToPayoff
    );
    expect(result.snowball.totalInterest).toBeCloseTo(
      result.avalanche.totalInterest,
      2
    );
  });
});
