import { describe, it, expect } from "vitest";
import {
  calculateDailyOverdueInterest,
  getTieredOverdueRate,
  checkOverdueStatus,
  calculateMonthlyPayment,
  calculateEffectiveRate,
  generateAmortizationSchedule,
} from "@/lib/overdueUtils";

describe("calculateDailyOverdueInterest", () => {
  it("calculates daily interest correctly", () => {
    const result = calculateDailyOverdueInterest(10000, 3.55, 10);
    expect(result.dailyRate).toBeCloseTo(3.55 / 30, 4);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalWithInterest).toBeGreaterThan(10000);
  });

  it("returns 0 interest for 0 days", () => {
    const result = calculateDailyOverdueInterest(10000, 3.55, 0);
    expect(result.totalInterest).toBe(0);
    expect(result.totalWithInterest).toBe(10000);
  });
});

describe("getTieredOverdueRate", () => {
  it("returns correct rate for under 30K", () => {
    const rate = getTieredOverdueRate(20000);
    expect(rate).toBe(3.55);
  });

  it("returns correct rate for 30K-180K", () => {
    const rate = getTieredOverdueRate(100000);
    expect(rate).toBe(4.05);
  });

  it("returns correct rate for over 180K", () => {
    const rate = getTieredOverdueRate(200000);
    expect(rate).toBe(4.55);
  });
});

describe("checkOverdueStatus", () => {
  it("returns not overdue for paid items", () => {
    const result = checkOverdueStatus(new Date("2020-01-01"), true);
    expect(result.isOverdue).toBe(false);
    expect(result.severity).toBe("none");
  });

  it("returns not overdue for future dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const result = checkOverdueStatus(futureDate, false);
    expect(result.isOverdue).toBe(false);
  });

  it("returns overdue with correct severity for past dates", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = checkOverdueStatus(pastDate, false);
    expect(result.isOverdue).toBe(true);
    expect(result.severity).toBe("warning");
  });

  it("returns danger severity for 7-30 days overdue", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 15);
    const result = checkOverdueStatus(pastDate, false);
    expect(result.isOverdue).toBe(true);
    expect(result.severity).toBe("danger");
  });

  it("returns critical severity for 30+ days overdue", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 45);
    const result = checkOverdueStatus(pastDate, false);
    expect(result.isOverdue).toBe(true);
    expect(result.severity).toBe("critical");
  });
});

describe("calculateMonthlyPayment", () => {
  it("calculates PMT correctly for standard loan", () => {
    const payment = calculateMonthlyPayment(100000, 2.5, 12);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBeLessThan(100000);
  });

  it("returns principal/months for 0 interest", () => {
    const payment = calculateMonthlyPayment(120000, 0, 12);
    expect(payment).toBeCloseTo(10000);
  });
});

describe("calculateEffectiveRate", () => {
  it("applies KKDF and BSMV multipliers", () => {
    const effective = calculateEffectiveRate(2.5);
    expect(effective).toBeGreaterThan(2.5);
  });
});

describe("generateAmortizationSchedule", () => {
  it("generates correct number of rows", () => {
    const result = generateAmortizationSchedule(100000, 2.5, 12);
    expect(result.schedule.length).toBe(12);
  });

  it("ends with ~0 balance", () => {
    const result = generateAmortizationSchedule(100000, 2.5, 12);
    const lastRow = result.schedule[result.schedule.length - 1];
    expect(lastRow.balance).toBeCloseTo(0, 0);
  });

  it("total payment equals monthlyPayment * months", () => {
    const result = generateAmortizationSchedule(100000, 2.5, 12);
    expect(result.totalPayment).toBeCloseTo(result.monthlyPayment * 12, 0);
  });
});
