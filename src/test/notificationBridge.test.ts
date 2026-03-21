import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSoundGroupForAction,
  consumePendingTapNav,
  NOTIFICATION_INBOX_ADD,
} from "@/lib/notificationBridge";

// Mock Capacitor to prevent native calls
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock("@/lib/notificationSoundService", () => ({
  playNotificationSound: vi.fn(),
}));

describe("notificationBridge", () => {
  describe("getSoundGroupForAction", () => {
    it("returns positive for golden-window", () => {
      expect(getSoundGroupForAction("golden-window")).toBe("positive");
    });

    it("returns info for statement-reminder", () => {
      expect(getSoundGroupForAction("statement-reminder")).toBe("info");
    });

    it("returns reminder for payment-reminder", () => {
      expect(getSoundGroupForAction("payment-reminder")).toBe("reminder");
    });

    it("returns warning for budget-alert", () => {
      expect(getSoundGroupForAction("budget-alert")).toBe("warning");
    });

    it("returns urgent for overdue-card", () => {
      expect(getSoundGroupForAction("overdue-card")).toBe("urgent");
    });

    it("returns info for unknown action type", () => {
      expect(getSoundGroupForAction("unknown-action")).toBe("info");
    });

    it("returns reminder for loan-reminder", () => {
      expect(getSoundGroupForAction("loan-reminder")).toBe("reminder");
    });

    it("returns warning for tax-reminder", () => {
      expect(getSoundGroupForAction("tax-reminder")).toBe("warning");
    });

    it("returns warning for vehicle-inspection", () => {
      expect(getSoundGroupForAction("vehicle-inspection")).toBe("warning");
    });

    it("returns urgent for overdue-loan", () => {
      expect(getSoundGroupForAction("overdue-loan")).toBe("urgent");
    });
  });

  describe("consumePendingTapNav", () => {
    it("returns null when no pending nav", () => {
      expect(consumePendingTapNav()).toBeNull();
    });
  });

  describe("constants", () => {
    it("exports correct event name", () => {
      expect(NOTIFICATION_INBOX_ADD).toBe("notification-inbox-add");
    });
  });
});
