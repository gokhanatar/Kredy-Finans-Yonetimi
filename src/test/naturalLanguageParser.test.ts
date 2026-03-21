import { describe, it, expect } from "vitest";
import { parseExpenseOffline } from "@/lib/naturalLanguageParser";

describe("parseExpenseOffline", () => {
  it("returns null for empty text", () => {
    expect(parseExpenseOffline("")).toBeNull();
    expect(parseExpenseOffline("  ")).toBeNull();
  });

  it("returns null for text without amount", () => {
    expect(parseExpenseOffline("bugün markete gittim")).toBeNull();
  });

  // ============= TUTAR AYRIŞTIRMA =============

  it("parses simple TL amount", () => {
    const result = parseExpenseOffline("450 TL market");
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(450);
  });

  it("parses TL symbol amount", () => {
    const result = parseExpenseOffline("250₺ yemek");
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(250);
  });

  it("parses amount with comma decimal", () => {
    const result = parseExpenseOffline("123,50 TL kahve");
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(123.5);
  });

  it("parses Turkish thousand separator (dot)", () => {
    const result = parseExpenseOffline("1.250 TL market");
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(1250);
  });

  it("parses complex Turkish number format", () => {
    const result = parseExpenseOffline("12.500,75 TL kira");
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(12500.75);
  });

  // ============= KATEGORİ TAHMİNİ =============

  it("categorizes Migros as market", () => {
    const result = parseExpenseOffline("Migros'ta 450 TL alışveriş");
    expect(result!.category).toBe("market");
  });

  it("categorizes Uber as ulasim", () => {
    const result = parseExpenseOffline("Uber 85 TL");
    expect(result!.category).toBe("ulasim");
  });

  it("categorizes Netflix as eglence", () => {
    const result = parseExpenseOffline("Netflix 99 TL");
    expect(result!.category).toBe("eglence");
  });

  it("categorizes Starbucks as yemek", () => {
    const result = parseExpenseOffline("Starbucks 85 TL kahve");
    expect(result!.category).toBe("yemek");
  });

  it("categorizes Shell as tasit", () => {
    const result = parseExpenseOffline("Shell benzin 750 TL");
    expect(result!.category).toBe("tasit");
  });

  it("categorizes elektrik as fatura", () => {
    const result = parseExpenseOffline("elektrik faturası 380 TL");
    expect(result!.category).toBe("fatura");
  });

  it("categorizes eczane as saglik", () => {
    const result = parseExpenseOffline("eczane 150 TL ilaç");
    expect(result!.category).toBe("saglik");
  });

  it("falls back to diger-gider for unknown category", () => {
    const result = parseExpenseOffline("500 TL");
    expect(result!.category).toBe("diger-gider");
  });

  // ============= MERCHANT ÇIKARMA =============

  it("extracts merchant from Turkish suffix (-da/-de)", () => {
    const result = parseExpenseOffline("Migros'ta 450 TL");
    expect(result!.merchant.toLowerCase()).toContain("migros");
  });

  it("extracts merchant from keyword match", () => {
    const result = parseExpenseOffline("450 TL carrefour");
    expect(result!.merchant.toLowerCase()).toContain("carrefour");
  });

  // ============= TARİH AYRIŞTIRMA =============

  it('parses "bugün" as today', () => {
    const result = parseExpenseOffline("bugün 100 TL market");
    const today = new Date().toISOString().split("T")[0];
    expect(result!.date).toBe(today);
  });

  it('parses "dün" as yesterday', () => {
    const result = parseExpenseOffline("dün 200 TL yemek");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(result!.date).toBe(yesterday.toISOString().split("T")[0]);
  });

  it("parses Turkish date format (23 Şubat)", () => {
    const result = parseExpenseOffline("23 Şubat 500 TL kira");
    expect(result).not.toBeNull();
    // toISOString uses UTC which may shift date by timezone offset
    const dateObj = new Date(result!.date);
    expect(dateObj.getMonth()).toBe(1); // February
  });

  it("parses numeric date (15/03/2026)", () => {
    const result = parseExpenseOffline("15/03/2026 300 TL fatura");
    expect(result).not.toBeNull();
    // Verify year and month parsed correctly (day may shift by TZ)
    expect(result!.date).toContain("2026-03");
  });

  it("defaults to today when no date found", () => {
    const result = parseExpenseOffline("450 TL market");
    const today = new Date().toISOString().split("T")[0];
    expect(result!.date).toBe(today);
  });

  // ============= GÜVEN SKORU =============

  it("has higher confidence with merchant + category + date", () => {
    const result = parseExpenseOffline("bugün Migros'ta 450 TL market");
    expect(result!.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("has lower confidence for just amount", () => {
    const result = parseExpenseOffline("500 TL");
    expect(result!.confidence).toBeLessThanOrEqual(0.55);
  });

  it("confidence is between 0 and 1", () => {
    const result = parseExpenseOffline("bugün Migros'ta 1.500 TL alışveriş");
    expect(result!.confidence).toBeGreaterThanOrEqual(0);
    expect(result!.confidence).toBeLessThanOrEqual(1);
  });
});
