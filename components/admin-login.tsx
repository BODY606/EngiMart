"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

export function AdminLogin() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const t = useT();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || t("auth.fail"));
      setPending(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="wrap page max-w-md mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" title="ElectroMart">
          <Image
            src="/electromart-logo-clean.png"
            alt="ElectroMart"
            width={150}
            height={43}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <LanguageSwitcher />
      </div>
      <h1 className="page-title">{t("admin.password")}</h1>
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="surface stack mt-8 p-6"
      >
        <div>
          <label htmlFor="password">{t("admin.adminPassword")}</label>
          <div className="relative flex items-center">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoFocus
              required
              autoComplete="current-password"
              className="w-full"
              style={{ paddingInlineEnd: "2.75rem" }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPassword((prev) => !prev);
              }}
              className="absolute end-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:text-forest transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              tabIndex={-1}
            >
              {showPassword ? (
                <IconEyeOff size={19} stroke={1.8} className="pointer-events-none" />
              ) : (
                <IconEye size={19} stroke={1.8} className="pointer-events-none" />
              )}
            </button>
          </div>
        </div>
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary" disabled={pending}>
          <PendingLabel
            pending={pending}
            idle={t("admin.continue")}
            busy={t("admin.checking")}
          />
        </button>
      </form>
    </div>
  );
}
