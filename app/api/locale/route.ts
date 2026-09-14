import { COOKIE_LOCALE, isLocale } from "@/lib/i18n";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { locale?: string } | null;
  const locale = isLocale(body?.locale) ? body.locale : "en";
  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set(COOKIE_LOCALE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
