import { describe, it, expect } from "vitest";
import {
  analyzeSpendingTrends,
  detectAnomalies,
  getMonthlyComparison,
  generateInsights,
} from "@/lib/spendingAnalysis";
import { FamilyTransaction } from "@/types/familyFinance";

function makeTx(
  category: string,
  amount: number,
  monthsAgo: number,
  dayOfMonth: number = 15,
  type: "expense" | "income" = "expense"
): FamilyTransaction {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(dayOfMonth);
  return {
    id: `${category}-${monthsAgo}-${amount}-${Math.random()}`,
    amount,
    category,
    type,
    date: d.toISOString(),
    description: `${category} harcama`,
    addedBy: "test",
  } as FamilyTransaction;
}

describe("analyzeSpendingTrends", () => {
  it("returns empty for no transactions", () => {
    expect(analyzeSpendingTrends([])).toEqual([]);
  });

  it("returns empty for only income transactions", () => {
    const txs = [
      makeTx("maas", 10000, 0, 15, "income"),
      makeTx("maas", 10000, 1, 15, "income"),
    ];
    expect(analyzeSpendingTrends(txs)).toEqual([]);
  });

  it("detects upward trend", () => {
    const txs = [
      makeTx("market", 1000, 1), // previous month
      makeTx("market", 2000, 0), // current month (100% increase)
    ];
    const trends = analyzeSpendingTrends(txs, 2);
    const marketTrend = trends.find((t) => t.category === "market");
    expect(marketTrend).toBeDefined();
    expect(marketTrend!.direction).toBe("up");
    expect(marketTrend!.changePercent).toBe(100);
  });

  it("detects downward trend", () => {
    const txs = [
      makeTx("eglence", 2000, 1),
      makeTx("eglence", 500, 0),
    ];
    const trends = analyzeSpendingTrends(txs, 2);
    const trend = trends.find((t) => t.category === "eglence");
    expect(trend!.direction).toBe("down");
    expect(trend!.changePercent).toBe(-75);
  });

  it("marks stable when change is within 5%", () => {
    const txs = [
      makeTx("fatura", 1000, 1),
      makeTx("fatura", 1030, 0), // 3% increase
    ];
    const trends = analyzeSpendingTrends(txs, 2);
    const trend = trends.find((t) => t.category === "fatura");
    expect(trend!.direction).toBe("stable");
  });

  it("sorts by absolute change percent descending", () => {
    const txs = [
      makeTx("market", 1000, 1),
      makeTx("market", 1500, 0), // 50%
      makeTx("ulasim", 500, 1),
      makeTx("ulasim", 300, 0), // -40%
      makeTx("fatura", 800, 1),
      makeTx("fatura", 810, 0), // ~1%
    ];
    const trends = analyzeSpendingTrends(txs, 2);
    expect(Math.abs(trends[0].changePercent)).toBeGreaterThanOrEqual(
      Math.abs(trends[trends.length - 1].changePercent)
    );
  });
});

describe("detectAnomalies", () => {
  it("returns empty for no transactions", () => {
    expect(detectAnomalies([])).toEqual([]);
  });

  it("returns empty when fewer than 3 transactions per category", () => {
    const txs = [makeTx("market", 100, 0), makeTx("market", 200, 1)];
    expect(detectAnomalies(txs)).toEqual([]);
  });

  it("detects anomalous high spending", () => {
    // Normal spending: ~100 TL, extreme anomaly at 5000 TL (z-score > 3)
    const txs = [
      makeTx("market", 100, 0, 1),
      makeTx("market", 110, 0, 5),
      makeTx("market", 95, 0, 10),
      makeTx("market", 105, 0, 15),
      makeTx("market", 100, 0, 17),
      makeTx("market", 98, 0, 18),
      makeTx("market", 5000, 0, 20), // extreme anomaly
    ];
    const anomalies = detectAnomalies(txs);
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].transaction.amount).toBe(5000);
    expect(["warning", "alert"]).toContain(anomalies[0].severity);
  });

  it("sorts by severity (alert first)", () => {
    const txs = [
      makeTx("yemek", 50, 0, 1),
      makeTx("yemek", 55, 0, 2),
      makeTx("yemek", 45, 0, 3),
      makeTx("yemek", 48, 0, 4),
      makeTx("yemek", 500, 0, 5), // big anomaly
      makeTx("yemek", 200, 0, 6), // smaller anomaly
    ];
    const anomalies = detectAnomalies(txs);
    if (anomalies.length >= 2) {
      const severityOrder: Record<string, number> = {
        alert: 0,
        warning: 1,
        info: 2,
      };
      expect(severityOrder[anomalies[0].severity]).toBeLessThanOrEqual(
        severityOrder[anomalies[1].severity]
      );
    }
  });
});

describe("getMonthlyComparison", () => {
  it("returns empty for no transactions", () => {
    expect(getMonthlyComparison([])).toEqual([]);
  });

  it("returns correct number of months", () => {
    const txs = [
      makeTx("market", 500, 0),
      makeTx("market", 600, 1),
      makeTx("market", 700, 2),
    ];
    const result = getMonthlyComparison(txs, 3);
    expect(result.length).toBe(3);
  });

  it("calculates category totals correctly", () => {
    const txs = [
      makeTx("market", 300, 0),
      makeTx("market", 200, 0),
      makeTx("ulasim", 150, 0),
    ];
    const result = getMonthlyComparison(txs, 1);
    const current = result[result.length - 1];
    expect(current.categories["market"]).toBe(500);
    expect(current.categories["ulasim"]).toBe(150);
    expect(current.total).toBe(650);
  });
});

describe("generateInsights", () => {
  it("returns empty for no transactions", () => {
    expect(generateInsights([])).toEqual([]);
  });

  it("generates increase insight for >20% spending increase", () => {
    const txs = [
      makeTx("market", 1000, 1),
      makeTx("market", 2000, 0), // 100% increase
    ];
    const insights = generateInsights(txs);
    const increaseInsight = insights.find((i) => i.type === "increase");
    expect(increaseInsight).toBeDefined();
    expect(increaseInsight!.message).toContain("arttı");
  });

  it("generates decrease insight for >20% spending decrease", () => {
    const txs = [
      makeTx("eglence", 2000, 1),
      makeTx("eglence", 500, 0), // -75% decrease
    ];
    const insights = generateInsights(txs);
    const decreaseInsight = insights.find((i) => i.type === "decrease");
    expect(decreaseInsight).toBeDefined();
    expect(decreaseInsight!.message).toContain("azaldı");
  });
});
