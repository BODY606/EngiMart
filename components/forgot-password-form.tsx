"use client";

import { PendingLabel } from "@/components/pending-label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import { forgotPasswordSchema } from "@/lib/validations";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      const parsed = forgotPasswordSchema.safeParse({
        email: formData.get("email"),
      });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t("auth.checkForm"));
        setPending(false);
        return;
      }

      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";
      const redirectTo = `${origin}/auth/callback?next=/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        { redirectTo },
      );

      if (resetError) {
        setError(resetError.message);
        setPending(false);
        return;
      }

      setSentEmail(parsed.data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.fail"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="wrap page grid items-center gap-8 lg:grid-cols-2">
      <div>
        <h1 className="page-title">{t("auth.forgotPasswordTitle")}</h1>
        <p className="mt-4 text-ink-soft">{t("auth.forgotPasswordLead")}</p>
      </div>

      <div className="surface stack p-6">
        {sentEmail ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-success dark:text-emerald-400">
              <p className="font-semibold">{t("auth.resetLinkSent")}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {t("auth.resetLinkSentLead", { email: sentEmail })}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/login" className="btn btn-primary w-full text-center">
                {t("auth.backToLogin")}
              </Link>
            </div>
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(new FormData(event.currentTarget));
            }}
          >
            <div>
              <label htmlFor="email">{t("auth.email")}</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
              />
            </div>

            {error && <p className="field-error">{error}</p>}

            <button className="btn btn-primary w-full" disabled={pending}>
              <PendingLabel
                pending={pending}
                idle={t("auth.sendResetLink")}
                busy={t("auth.wait")}
              />
            </button>

            <p className="text-center text-sm text-ink-soft">
              <Link className="text-forest hover:underline" href="/login">
                {t("auth.backToLogin")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
