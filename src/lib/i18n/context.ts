import { createContext, useContext } from "react";
import type { Locale } from "./index";
import { t, getDictionary } from "./translate";

export type I18nContextValue = {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  dictionary: Record<string, unknown>;
};

export const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: (key: string, fallback?: string) => t("en", key, fallback),
  dictionary: getDictionary("en"),
});

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
