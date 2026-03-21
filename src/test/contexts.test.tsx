import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React, { ReactNode } from "react";
import { SimpleModeProvider, useSimpleMode } from "@/contexts/SimpleModeContext";
import { PrivacyModeProvider, usePrivacyModeContext } from "@/contexts/PrivacyModeContext";

// ============= SimpleModeContext =============

describe("SimpleModeContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SimpleModeProvider>{children}</SimpleModeProvider>
  );

  it("defaults to false (classic mode)", () => {
    const { result } = renderHook(() => useSimpleMode(), { wrapper });
    expect(result.current.isSimpleMode).toBe(false);
  });

  it("toggles mode", () => {
    const { result } = renderHook(() => useSimpleMode(), { wrapper });

    act(() => {
      result.current.toggleSimpleMode();
    });

    expect(result.current.isSimpleMode).toBe(true);

    act(() => {
      result.current.toggleSimpleMode();
    });

    expect(result.current.isSimpleMode).toBe(false);
  });

  it("sets mode directly", () => {
    const { result } = renderHook(() => useSimpleMode(), { wrapper });

    act(() => {
      result.current.setSimpleMode(true);
    });

    expect(result.current.isSimpleMode).toBe(true);
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useSimpleMode(), { wrapper });

    act(() => {
      result.current.setSimpleMode(true);
    });

    const stored = JSON.parse(
      localStorage.getItem("kredi-pusula-simple-mode")!
    );
    expect(stored).toBe(true);
  });

  it("throws error outside provider", () => {
    expect(() => {
      renderHook(() => useSimpleMode());
    }).toThrow("useSimpleMode must be used within a SimpleModeProvider");
  });
});

// ============= PrivacyModeContext =============

describe("PrivacyModeContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <PrivacyModeProvider>{children}</PrivacyModeProvider>
  );

  it("defaults to false (public mode)", () => {
    const { result } = renderHook(() => usePrivacyModeContext(), { wrapper });
    expect(result.current.isPrivate).toBe(false);
  });

  it("toggles privacy mode", () => {
    const { result } = renderHook(() => usePrivacyModeContext(), { wrapper });

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isPrivate).toBe(true);
  });

  it("sets privacy mode directly", () => {
    const { result } = renderHook(() => usePrivacyModeContext(), { wrapper });

    act(() => {
      result.current.setIsPrivate(true);
    });

    expect(result.current.isPrivate).toBe(true);
  });

  it("formats amount normally when public", () => {
    const { result } = renderHook(() => usePrivacyModeContext(), { wrapper });
    const formatted = result.current.formatAmount(1500.5);
    expect(formatted).toContain("1.500");
    expect(formatted).toContain("₺");
  });

  it("masks amount when private", () => {
    const { result } = renderHook(() => usePrivacyModeContext(), { wrapper });

    act(() => {
      result.current.setIsPrivate(true);
    });

    expect(result.current.formatAmount(1500)).toBe("***");
  });

  it("formats short amount normally when public", () => {
    const { result } = renderHook(() => usePrivacyModeContext(), { wrapper });
    expect(result.current.formatAmountShort(1500)).toBe("1.5K");
    expect(result.current.formatAmountShort(1500000)).toBe("1.5M");
    expect(result.current.formatAmountShort(500)).toContain("500");
  });

  it("masks short amount when private", () => {
    const { result } = renderHook(() => usePrivacyModeContext(), { wrapper });

    act(() => {
      result.current.setIsPrivate(true);
    });

    expect(result.current.formatAmountShort(1500)).toBe("***");
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => usePrivacyModeContext(), { wrapper });

    act(() => {
      result.current.setIsPrivate(true);
    });

    const stored = JSON.parse(
      localStorage.getItem("family-finance-privacy-mode")!
    );
    expect(stored).toBe(true);
  });

  it("throws error outside provider", () => {
    expect(() => {
      renderHook(() => usePrivacyModeContext());
    }).toThrow(
      "usePrivacyModeContext must be used within a PrivacyModeProvider"
    );
  });
});
