"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    });
  }

  return (
    <div className="lang-switch" role="group" aria-label={t("lang.switchTo")}>
      <button
        type="button"
        className={locale === "en" ? "is-active" : ""}
        aria-pressed={locale === "en"}
        disabled={pending}
        onClick={() => setLocale("en")}
      >
        {t("lang.en")}
      </button>
      <span className="lang-switch-sep" aria-hidden>
        /
      </span>
      <button
        type="button"
        className={locale === "ar" ? "is-active" : ""}
        aria-pressed={locale === "ar"}
        disabled={pending}
        onClick={() => setLocale("ar")}
      >
        {t("lang.ar")}
      </button>
    </div>
  );
}
