import { accountLabel } from "@/lib/account-label";
import type { Metadata } from "next";
import { Instrument_Serif, Noto_Sans_Arabic, Outfit } from "next/font/google";
import { PublicShell } from "@/components/public-shell";
import { hasPublicSupabaseConfig } from "@/lib/env";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { I18nProvider } from "@/lib/i18n/provider";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/supabase/user";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  if (locale === "ar") {
    return {
      title: {
        default: "EngiMart — توريد من القاهرة، تسليم في الفيوم",
        template: "%s · EngiMart",
      },
      description:
        "مستلزمات الهندسة وعلوم الحاسب للمهندسين. نُورّد من القاهرة ونسلّم في الفيوم.",
    };
  }
  return {
    title: {
        default: "EngiMart — Sourced in Cairo, delivered in Fayoum",
        template: "%s · EngiMart",
      },
      description:
        "Engineering and computer-science components. Sourced in Cairo, delivered in Fayoum.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const configured = hasPublicSupabaseConfig();
  let userName: string | null = null;

  if (configured) {
    try {
      const user = await getCachedUser();
      if (user) {
        const supabase = await createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        const meta = user.user_metadata as Record<string, unknown> | undefined;
        userName = accountLabel({
          fullName: profile?.full_name,
          metaName:
            (typeof meta?.full_name === "string" && meta.full_name) ||
            (typeof meta?.name === "string" && meta.name) ||
            null,
          email: user.email,
        });
      }
    } catch {
      userName = null;
    }
  }

  return (
    <html
      lang={locale === "ar" ? "ar" : "en"}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${outfit.variable} ${instrument.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider locale={locale} dict={dict}>
          <PublicShell
            userName={userName}
            configured={configured}
          >
            {children}
          </PublicShell>
        </I18nProvider>
      </body>
    </html>
  );
}
