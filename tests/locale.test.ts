import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, getStoredCurrency, preferenceForLanguage } from "@/lib/locale";

describe("locale preferences", () => {
  it("pairs each flag choice with its language and currency", () => {
    expect(preferenceForLanguage("pt-BR")).toEqual(DEFAULT_LOCALE);
    expect(preferenceForLanguage("en-US")).toEqual({ language: "en-US", currency: "USD" });
  });

  it("uses Brazilian real when no browser preference exists", () => {
    expect(getStoredCurrency()).toBe("BRL");
  });
});
