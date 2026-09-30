export type Locale = "en" | "sw";

export const SUPPORTED_LOCALES: Locale[] = ["en", "sw"];
export const DEFAULT_LOCALE: Locale = "en";

export function detectLocale(input?: string): Locale {
  const raw = (input || "").toLowerCase().startsWith("sw") ? "sw" : "en";
  return SUPPORTED_LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;
}

export function localeLabel(locale: Locale): string {
  return locale === "sw" ? "Swahili" : "English";
}
