import { describe, it, expect } from "vitest";
import { calculateRentIncrease } from "@/lib/rentCalculation";

describe("calculateRentIncrease", () => {
  it("calculates rent increase correctly", () => {
    const result = calculateRentIncrease(10000, 30);
    expect(result.newRent).toBe(13000);
    expect(result.increaseAmount).toBe(3000);
    expect(result.rate).toBe(30);
  });

  it("handles zero inflation", () => {
    const result = calculateRentIncrease(10000, 0);
    expect(result.newRent).toBe(10000);
    expect(result.increaseAmount).toBe(0);
  });

  it("handles zero rent", () => {
    const result = calculateRentIncrease(0, 30);
    expect(result.newRent).toBe(0);
    expect(result.increaseAmount).toBe(0);
  });

  it("handles high inflation rate", () => {
    const result = calculateRentIncrease(5000, 100);
    expect(result.newRent).toBe(10000);
    expect(result.increaseAmount).toBe(5000);
  });

  it("handles decimal rent amounts", () => {
    const result = calculateRentIncrease(8500.50, 25);
    expect(result.newRent).toBeCloseTo(10625.625, 2);
    expect(result.increaseAmount).toBeCloseTo(2125.125, 2);
  });
});
