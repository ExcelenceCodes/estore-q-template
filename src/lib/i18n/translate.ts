import type { Locale } from "./index";
import en from "./locales/en.json";
import sw from "./locales/sw.json";

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en,
  sw,
};

type Path = string;

function get(obj: Record<string, unknown>, path: string): string {
  return path.split(".").reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return path;
  }, obj) as string;
}

export function t(locale: Locale, key: string, fallback?: string): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  const value = get(dict, key);
  if (typeof value === "string" && value !== key) return value;
  return fallback ?? key;
}

export function getDictionary(locale: Locale): Record<string, unknown> {
  return dictionaries[locale] ?? dictionaries.en;
}
