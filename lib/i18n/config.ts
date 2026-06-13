export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";
export const STORAGE_KEY = "seedao.locale";

export const localeLabels: Record<Locale, string> = {
  zh: "中文",
  en: "EN",
};

/** A piece of content that exists in both languages. */
export type Localized<T = string> = { zh: T; en: T };

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}
