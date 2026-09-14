"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useState } from "react";

export function AdminLogin() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
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
    <div className="wrap page">
      <div className="mb-8 flex justify-end">
        <LanguageSwitcher />
      </div>
      <h1 className="page-title">{t("admin.password")}</h1>
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="surface stack mt-8 p-6"
      >
        <div>
          <label htmlFor="password">{t("admin.adminPassword")}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoFocus
            required
            autoComplete="current-password"
          />
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
