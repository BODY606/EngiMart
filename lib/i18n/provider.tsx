"use client";

import { createT, type Dict, type Locale, type Translate } from "@/lib/i18n";
import { createContext, useContext, useMemo, type ReactNode } from "react";

type I18nValue = {
  locale: Locale;
  dict: Dict;
  t: Translate;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({ locale, dict, t: createT(dict) }),
    [locale, dict],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}

export function useLocale() {
  return useI18n().locale;
}
