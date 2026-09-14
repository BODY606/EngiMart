import { ar } from "./ar";
import { COOKIE_LOCALE, en, type Dict, type Locale } from "./en";

export type { Dict, Locale };
export { COOKIE_LOCALE };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ar";
}

export function getDictionary(locale: Locale): Dict {
  return locale === "ar" ? ar : en;
}

type Nested = string | { [key: string]: Nested };

function lookup(dict: Nested, path: string): string | undefined {
  const parts = path.split(".");
  let current: Nested | undefined = dict;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function createT(dict: Dict): Translate {
  return (key, vars) => {
    let value = lookup(dict as unknown as Nested, key) ?? lookup(en as unknown as Nested, key) ?? key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  };
}
