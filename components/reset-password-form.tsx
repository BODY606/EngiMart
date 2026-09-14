"use client";

import { PendingLabel } from "@/components/pending-label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import { resetPasswordSchema } from "@/lib/validations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t("auth.checkForm"));
        setPending(false);
        return;
      }

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (updateError) {
        setError(updateError.message);
        setPending(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.fail"));
      setPending(false);
    }
  }

  return (
    <div className="wrap page grid items-center gap-8 lg:grid-cols-2">
      <div>
        <h1 className="page-title">{t("auth.resetPasswordTitle")}</h1>
        <p className="mt-4 text-ink-soft">{t("auth.resetPasswordLead")}</p>
      </div>

      <div className="surface stack p-6">
        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-success dark:text-emerald-400">
              <p className="font-semibold">{t("auth.passwordUpdated")}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {t("auth.passwordUpdatedLead")}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/account" className="btn btn-primary w-full text-center">
                {t("account.title")}
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
              <label htmlFor="password">{t("auth.newPassword")}</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword">
                {t("auth.confirmNewPassword")}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="field-error">{error}</p>}

            <button className="btn btn-primary w-full" disabled={pending}>
              <PendingLabel
                pending={pending}
                idle={t("auth.updatePasswordBtn")}
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
