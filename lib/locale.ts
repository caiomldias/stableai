import type { Currency } from "@/lib/types";

export type AppLanguage = "pt-BR" | "en-US";

export type LocalePreference = {
  language: AppLanguage;
  currency: Currency;
};

export const LOCALE_STORAGE_KEY = "stableai-locale";
export const DEFAULT_LOCALE: LocalePreference = { language: "pt-BR", currency: "BRL" };

export function preferenceForLanguage(language: AppLanguage): LocalePreference {
  return language === "en-US"
    ? { language: "en-US", currency: "USD" }
    : { language: "pt-BR", currency: "BRL" };
}

export function readLocalePreference(): LocalePreference {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCALE_STORAGE_KEY) || "null") as Partial<LocalePreference> | null;
    return parsed?.language === "en-US" ? preferenceForLanguage("en-US") : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function getStoredLanguage(): AppLanguage {
  return readLocalePreference().language;
}

export function getStoredCurrency(): Currency {
  return readLocalePreference().currency;
}

export function intlLocale(language = getStoredLanguage()) {
  return language === "en-US" ? "en-US" : "pt-BR";
}
