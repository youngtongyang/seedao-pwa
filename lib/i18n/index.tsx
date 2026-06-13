"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  defaultLocale,
  locales,
  pick,
  STORAGE_KEY,
  type Locale,
  type Localized,
} from "./config";
import { messages, type Messages } from "./messages";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Restore a previously chosen locale on the client.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && locales.includes(stored)) setLocaleState(stored);
  }, []);

  // Keep <html lang> in sync for a11y / SEO.
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage failures (private mode etc.) */
    }
  }, []);

  const toggleLocale = useCallback(
    () => setLocale(locale === "zh" ? "en" : "zh"),
    [locale, setLocale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale }),
    [locale, setLocale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

/** The full message dictionary for the active locale (nested, type-safe). */
export function useT(): Messages {
  const { locale } = useI18n();
  return messages[locale];
}

/** Resolve a piece of bilingual content (e.g. mock data) for the active locale. */
export function useLocalized() {
  const { locale } = useI18n();
  return useCallback(<T,>(value: Localized<T>) => pick(value, locale), [locale]);
}
