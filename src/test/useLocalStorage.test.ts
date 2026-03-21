import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial value when nothing stored", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("returns stored value when exists", () => {
    localStorage.setItem("test-key", JSON.stringify("stored-value"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("stored-value");
  });

  it("updates value and persists to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem("test-key")!)).toBe("updated");
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() => useLocalStorage("counter", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it("handles objects", () => {
    const initial = { name: "Test", age: 25 };
    const { result } = renderHook(() => useLocalStorage("obj-key", initial));

    expect(result.current[0]).toEqual(initial);

    act(() => {
      result.current[1]({ name: "Updated", age: 30 });
    });

    expect(result.current[0]).toEqual({ name: "Updated", age: 30 });
  });

  it("handles arrays", () => {
    const { result } = renderHook(() =>
      useLocalStorage<string[]>("arr-key", [])
    );

    act(() => {
      result.current[1]((prev) => [...prev, "item1"]);
    });

    expect(result.current[0]).toEqual(["item1"]);
  });

  it("returns initial value for corrupted JSON", () => {
    localStorage.setItem("bad-key", "not-json{{{");
    const { result } = renderHook(() =>
      useLocalStorage("bad-key", "fallback")
    );
    expect(result.current[0]).toBe("fallback");
  });

  it("handles boolean values", () => {
    const { result } = renderHook(() =>
      useLocalStorage("bool-key", false)
    );

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
    expect(JSON.parse(localStorage.getItem("bool-key")!)).toBe(true);
  });
});
