import { describe, it, expect, beforeEach } from "vitest";
import { getStorageUsage, clearAllData } from "@/lib/dataService";

describe("dataService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getStorageUsage", () => {
    it("returns 0 for empty storage", () => {
      const result = getStorageUsage();
      expect(result.used).toBe(0);
    });

    it("returns non-zero after adding data", () => {
      localStorage.setItem("test-key", "test-value");
      const result = getStorageUsage();
      expect(result.used).toBeGreaterThan(0);
    });

    it("returns formatted string", () => {
      localStorage.setItem("test-key", "x".repeat(1000));
      const result = getStorageUsage();
      expect(result.formatted).toMatch(/\d+(\.\d+)?\s*(B|KB|MB)/);
    });
  });

  describe("clearAllData", () => {
    it("removes all kredi-pusula keys", () => {
      localStorage.setItem("kredi-pusula-cards", "[]");
      localStorage.setItem("kredi-pusula-loans", "[]");
      localStorage.setItem("other-key", "keep");

      clearAllData();

      expect(localStorage.getItem("kredi-pusula-cards")).toBeNull();
      expect(localStorage.getItem("kredi-pusula-loans")).toBeNull();
      expect(localStorage.getItem("other-key")).toBe("keep");
    });
  });
});
