"use client";

import { forgotPasswordSchema, loginSchema, signupSchema } from "@/lib/validations";
import { PendingLabel } from "@/components/pending-label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AuthForm({
  mode: propMode = "login",
}: {
  mode?: "login" | "signup" | "forgot";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [currentMode, setCurrentMode] = useState<"login" | "signup" | "forgot">(
    propMode,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const t = useT();

  async function onForgotSubmit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      const email = (formData.get("email") as string) || emailInput;
      const parsed = forgotPasswordSchema.safeParse({ email });
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

  async function onAuthSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const supabase = createClient();

    try {
      if (currentMode === "signup") {
        const parsed = signupSchema.safeParse({
          fullName: formData.get("fullName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          password: formData.get("password"),
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? t("auth.checkForm"));
          setPending(false);
          return;
        }
        const { error: signError } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: {
              full_name: parsed.data.fullName,
              phone: parsed.data.phone,
            },
          },
        });
        if (signError) {
          setError(signError.message);
          setPending(false);
          return;
        }
      } else {
        const parsed = loginSchema.safeParse({
          email: formData.get("email"),
          password: formData.get("password"),
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? t("auth.checkForm"));
          setPending(false);
          return;
        }
        const { error: signError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (signError) {
          setError(signError.message);
          setPending(false);
          return;
        }
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.fail"));
      setPending(false);
    }
  }

  if (currentMode === "forgot") {
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
                <button
                  type="button"
                  onClick={() => {
                    setSentEmail(null);
                    setError(null);
                    setCurrentMode("login");
                  }}
                  className="btn btn-primary w-full text-center"
                >
                  {t("auth.backToLogin")}
                </button>
              </div>
            </div>
          ) : (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                void onForgotSubmit(new FormData(event.currentTarget));
              }}
            >
              <div>
                <label htmlFor="forgot-email">{t("auth.email")}</label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
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
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setCurrentMode("login");
                  }}
                  className="text-forest hover:underline cursor-pointer"
                >
                  {t("auth.backToLogin")}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page grid items-center gap-8 lg:grid-cols-2">
      <div>
        <h1 className="page-title">
          {currentMode === "login" ? t("auth.welcome") : t("auth.create")}
        </h1>
        <p className="mt-4 text-ink-soft">{t("auth.lead")}</p>
      </div>
      <form
        className="surface stack p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void onAuthSubmit(new FormData(event.currentTarget));
        }}
      >
        {currentMode === "signup" && (
          <>
            <div>
              <label htmlFor="fullName">{t("auth.fullName")}</label>
              <input id="fullName" name="fullName" required autoComplete="name" />
            </div>
            <div>
              <label htmlFor="phone">{t("auth.phone")}</label>
              <input
                id="phone"
                name="phone"
                required
                type="tel"
                autoComplete="tel"
                placeholder="01xxxxxxxxx"
                pattern="^(?:\+?20|0020|0)?1[0125][0-9]{8}$"
                title="يجب أن يبدأ الرقم بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً"
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password">{t("auth.password")}</label>
            {currentMode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCurrentMode("forgot");
                }}
                className="text-xs text-ink-soft hover:text-accent underline transition-colors cursor-pointer"
              >
                {t("auth.forgotPassword")}
              </button>
            )}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={currentMode === "login" ? "current-password" : "new-password"}
          />
        </div>
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary w-full" disabled={pending}>
          <PendingLabel
            pending={pending}
            idle={currentMode === "login" ? t("auth.signIn") : t("auth.createBtn")}
            busy={t("auth.wait")}
          />
        </button>
        <p className="text-sm text-ink-soft">
          {currentMode === "login" ? (
            <>
              {t("auth.newHere")}{" "}
              <Link
                className="text-forest"
                href={`/signup?next=${encodeURIComponent(next)}`}
              >
                {t("auth.create")}
              </Link>
            </>
          ) : (
            <>
              {t("auth.already")}{" "}
              <Link
                className="text-forest"
                href={`/login?next=${encodeURIComponent(next)}`}
              >
                {t("auth.signIn")}
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
