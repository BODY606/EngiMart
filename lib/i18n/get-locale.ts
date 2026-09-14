import { cookies } from "next/headers";
import { COOKIE_LOCALE, isLocale, type Locale } from "./index";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(COOKIE_LOCALE)?.value;
  return isLocale(value) ? value : "en";
}
