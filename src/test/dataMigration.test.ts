import { describe, it, expect, beforeEach } from "vitest";
import { runDataMigrationV2 } from "@/lib/dataMigration";

describe("runDataMigrationV2", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("copies old data to personal keys", () => {
    // Setup old data
    localStorage.setItem(
      "kredi-pusula-family-transactions",
      JSON.stringify([{ id: "1", amount: 100 }])
    );
    localStorage.setItem(
      "kredi-pusula-budgets",
      JSON.stringify([{ id: "b1" }])
    );

    runDataMigrationV2();

    // Check personal keys were created
    const personalTx = JSON.parse(
      localStorage.getItem("kredi-pusula-personal-transactions")!
    );
    expect(personalTx).toEqual([{ id: "1", amount: 100 }]);

    const personalBudgets = JSON.parse(
      localStorage.getItem("kredi-pusula-personal-budgets")!
    );
    expect(personalBudgets).toEqual([{ id: "b1" }]);
  });

  it("does not overwrite existing personal data", () => {
    localStorage.setItem(
      "kredi-pusula-family-transactions",
      JSON.stringify([{ id: "old" }])
    );
    localStorage.setItem(
      "kredi-pusula-personal-transactions",
      JSON.stringify([{ id: "existing" }])
    );

    runDataMigrationV2();

    const result = JSON.parse(
      localStorage.getItem("kredi-pusula-personal-transactions")!
    );
    expect(result).toEqual([{ id: "existing" }]);
  });

  it("sets migration flag after completion", () => {
    runDataMigrationV2();
    expect(localStorage.getItem("kredi-pusula-migration-v2-done")).toBeTruthy();
  });

  it("skips if migration already done", () => {
    localStorage.setItem("kredi-pusula-migration-v2-done", "2026-01-01");
    localStorage.setItem(
      "kredi-pusula-family-transactions",
      JSON.stringify([{ id: "1" }])
    );

    runDataMigrationV2();

    // Personal key should NOT be created since migration was already done
    expect(localStorage.getItem("kredi-pusula-personal-transactions")).toBeNull();
  });

  it("handles empty localStorage gracefully", () => {
    expect(() => runDataMigrationV2()).not.toThrow();
    expect(localStorage.getItem("kredi-pusula-migration-v2-done")).toBeTruthy();
  });
});
