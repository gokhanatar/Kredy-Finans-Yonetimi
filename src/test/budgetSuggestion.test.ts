import { describe, it, expect } from "vitest";
import {
  suggestBudget,
  suggestSavings,
  BudgetSuggestionItem,
} from "@/lib/budgetSuggestion";
import { FamilyTransaction } from "@/types/familyFinance";

// Helper: create a transaction in a specific month
function makeTransaction(
  category: string,
  amount: number,
  monthsAgo: number,
  type: "expense" | "income" = "expense"
): FamilyTransaction {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(15);
  return {
    id: `${category}-${monthsAgo}-${Math.random()}`,
    amount,
    category,
    type,
    date: d.toISOString(),
    description: `Test ${category}`,
    addedBy: "test",
  } as FamilyTransaction;
}

describe("suggestBudget", () => {
  it("returns empty array for no transactions", () => {
    expect(suggestBudget([])).toEqual([]);
  });

  it("returns empty array for only income transactions", () => {
    const incomes = [
      makeTransaction("maas", 10000, 1, "income"),
      makeTransaction("maas", 10000, 2, "income"),
    ];
    expect(suggestBudget(incomes)).toEqual([]);
  });

  it("calculates suggestions with 10% safety margin", () => {
    const txs = [
      makeTransaction("market", 1000, 1),
      makeTransaction("market", 1200, 2),
      makeTransaction("market", 1100, 3),
    ];
    const result = suggestBudget(txs, 3);
    expect(result.length).toBe(1);
    const marketSuggestion = result[0];
    // Average = (1000+1200+1100)/3 = 1100, suggested = ceil(1100 * 1.1) = 1210
    expect(marketSuggestion.category).toBe("market");
    expect(marketSuggestion.suggestedAmount).toBe(1210);
    expect(marketSuggestion.confidence).toBe("high");
  });

  it("assigns medium confidence for 2 months of data", () => {
    const txs = [
      makeTransaction("ulasim", 500, 1),
      makeTransaction("ulasim", 600, 2),
    ];
    const result = suggestBudget(txs, 3);
    expect(result[0].confidence).toBe("medium");
  });

  it("assigns low confidence for 1 month of data", () => {
    const txs = [makeTransaction("eglence", 300, 1)];
    const result = suggestBudget(txs, 3);
    expect(result[0].confidence).toBe("low");
  });

  it("sorts suggestions by highest budget first", () => {
    const txs = [
      makeTransaction("market", 2000, 1),
      makeTransaction("ulasim", 500, 1),
      makeTransaction("kira", 5000, 1),
    ];
    const result = suggestBudget(txs, 3);
    expect(result[0].category).toBe("kira");
    expect(result[result.length - 1].category).toBe("ulasim");
  });

  it("ignores current month transactions (incomplete month)", () => {
    const txs = [
      makeTransaction("market", 999, 0), // current month — should be excluded
      makeTransaction("market", 1000, 1),
    ];
    const result = suggestBudget(txs, 3);
    // Only 1 month of data from the completed months
    if (result.length > 0) {
      expect(result[0].averageSpend).toBe(1000);
    }
  });
});

describe("suggestSavings", () => {
  it("returns 0 for zero or negative income", () => {
    const result = suggestSavings(0, 5000);
    expect(result.suggestedSavings).toBe(0);
    expect(result.savingsPercent).toBe(0);
    expect(result.tips.length).toBeGreaterThan(0);
  });

  it("congratulates when savings exceed 20%", () => {
    const result = suggestSavings(10000, 5000);
    expect(result.savingsPercent).toBe(20);
    expect(result.tips.some((t) => t.includes("Harika"))).toBe(true);
  });

  it("suggests investment when savings exceed 30%", () => {
    const result = suggestSavings(10000, 3000);
    expect(result.tips.some((t) => t.includes("Yatırım"))).toBe(true);
  });

  it("warns when expenses exceed income", () => {
    const result = suggestSavings(5000, 7000);
    expect(result.tips.some((t) => t.includes("aşıyor"))).toBe(true);
  });

  it("calculates ideal savings at 20% of income", () => {
    const result = suggestSavings(10000, 8500);
    expect(result.suggestedSavings).toBe(2000); // 10000 * 0.20
  });

  it("warns about high expense ratio (>90%)", () => {
    const result = suggestSavings(10000, 9500);
    expect(result.tips.some((t) => t.includes("Sabit giderlerinizi"))).toBe(
      true
    );
  });

  it("provides 50/30/20 based max expense tip", () => {
    const result = suggestSavings(10000, 9000);
    expect(result.tips.some((t) => t.includes("50/30/20"))).toBe(true);
  });
});
