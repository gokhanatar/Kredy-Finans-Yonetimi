import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * IAP Service tests — @capgo/native-purchases
 * Web ortamında (native olmayan) davranışları test eder.
 */

// Mock @capgo/native-purchases — web'de plugin yok
vi.mock("@capgo/native-purchases", () => ({
  NativePurchases: {
    isBillingSupported: vi.fn().mockResolvedValue({ isBillingSupported: false }),
    getProducts: vi.fn().mockResolvedValue({ products: [] }),
    purchaseProduct: vi.fn().mockRejectedValue(new Error("Not available")),
    restorePurchases: vi.fn().mockResolvedValue(undefined),
    getPurchases: vi.fn().mockResolvedValue({ purchases: [] }),
    manageSubscriptions: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("IAPService", () => {
  let iapService: any;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();

    const mod = await import("@/lib/iapService");
    iapService = mod.iapService;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initialize", () => {
    it("should not throw on web platform", async () => {
      await expect(iapService.initialize()).resolves.not.toThrow();
    });

    it("should detect web platform as non-native", () => {
      expect(iapService.isNativeAvailable()).toBe(false);
    });

    it("should report plugin not ready on web", () => {
      expect(iapService.isPluginReady()).toBe(false);
    });
  });

  describe("getProducts", () => {
    it("should return default products on web", async () => {
      const products = await iapService.getProducts();
      expect(products).toHaveLength(2);
      expect(products[0].period).toBe("monthly");
      expect(products[1].period).toBe("yearly");
    });

    it("should return products with valid price info", async () => {
      const products = await iapService.getProducts();
      for (const product of products) {
        expect(product.id).toBeTruthy();
        expect(product.price).toBeTruthy();
        expect(product.priceAmount).toBeGreaterThan(0);
        expect(product.currency).toBe("TRY");
      }
    });
  });

  describe("purchaseMonthly", () => {
    it("should return false on web (no native platform)", async () => {
      const result = await iapService.purchaseMonthly();
      expect(result).toBe(false);
    });
  });

  describe("purchaseYearly", () => {
    it("should return false on web (no native platform)", async () => {
      const result = await iapService.purchaseYearly();
      expect(result).toBe(false);
    });
  });

  describe("restorePurchases", () => {
    it("should return false on web", async () => {
      const result = await iapService.restorePurchases();
      expect(result).toBe(false);
    });
  });

  describe("getActiveSubscription", () => {
    it("should return null when no subscription exists", async () => {
      const sub = await iapService.getActiveSubscription();
      expect(sub).toBeNull();
    });

    it("should return subscription from localStorage if valid", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      localStorage.setItem(
        "kredi-pusula-iap-subscription",
        JSON.stringify({
          plan: "yearly",
          activatedAt: new Date().toISOString(),
          expiresAt: futureDate.toISOString(),
        })
      );

      vi.resetModules();
      const mod = await import("@/lib/iapService");
      const freshService = mod.iapService;

      const sub = await freshService.getActiveSubscription();
      expect(sub).not.toBeNull();
      expect(sub?.plan).toBe("yearly");
      expect(sub?.isActive).toBe(true);
    });

    it("should return null for expired subscription", async () => {
      const pastDate = new Date("2020-01-01");

      localStorage.setItem(
        "kredi-pusula-iap-subscription",
        JSON.stringify({
          plan: "monthly",
          activatedAt: "2019-12-01T00:00:00.000Z",
          expiresAt: pastDate.toISOString(),
        })
      );

      vi.resetModules();
      const mod = await import("@/lib/iapService");
      const freshService = mod.iapService;

      const sub = await freshService.getActiveSubscription();
      expect(sub).toBeNull();
    });

    it("should handle corrupted localStorage data gracefully", async () => {
      localStorage.setItem("kredi-pusula-iap-subscription", "invalid-json{{{");

      vi.resetModules();
      const mod = await import("@/lib/iapService");
      const freshService = mod.iapService;

      const sub = await freshService.getActiveSubscription();
      expect(sub).toBeNull();
    });
  });

  describe("manageSubscriptions", () => {
    it("should not throw on web", async () => {
      await expect(iapService.manageSubscriptions()).resolves.not.toThrow();
    });
  });

  describe("network error scenarios", () => {
    it("should not throw on purchase when native unavailable", async () => {
      await expect(iapService.purchaseMonthly()).resolves.toBe(false);
      await expect(iapService.purchaseYearly()).resolves.toBe(false);
    });

    it("should not throw on restore when native unavailable", async () => {
      await expect(iapService.restorePurchases()).resolves.toBe(false);
    });

    it("should not throw on getActiveSubscription when native unavailable", async () => {
      await expect(iapService.getActiveSubscription()).resolves.toBeNull();
    });
  });
});
