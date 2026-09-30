"use client";

import { PendingLabel } from "@/components/pending-label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import { resetPasswordSchema, resetPasswordWithOtpSchema } from "@/lib/validations";
import {
  IconCheck,
  IconClock,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconRefresh,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Resend OTP state
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Silent fallback check: if arriving with an active recovery session from a working magic link
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setHasActiveSession(true);
        }
      } catch {
        // Fall through to OTP flow
      } finally {
        setCheckingSession(false);
      }
    }
    void checkSession();
  }, []);

  // Cooldown countdown timer for resend code
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  async function handleResendCode() {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(t("auth.checkForm"));
      return;
    }
    if (cooldown > 0 || resending) return;

    setError(null);
    setResending(true);
    setResendSuccess(false);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";
      const redirectTo = `${origin}/auth/callback?next=/reset-password&email=${encodeURIComponent(cleanEmail)}`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        { redirectTo },
      );

      if (resetError) {
        setError(resetError.message);
      } else {
        setResendSuccess(true);
        setCooldown(60);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.fail"));
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();

    try {
      if (hasActiveSession) {
        // Silent fallback: Session already established via magic link
        const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? t("auth.checkForm"));
          setPending(false);
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: parsed.data.password,
        });

        if (updateError) {
          setError(updateError.message);
          setPending(false);
          return;
        }
      } else {
        // Primary flow: Verify OTP code, then update password
        const cleanEmail = email.trim();
        const cleanCode = code.trim();

        const parsed = resetPasswordWithOtpSchema.safeParse({
          email: cleanEmail,
          code: cleanCode,
          password,
          confirmPassword,
        });

        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? t("auth.checkForm"));
          setPending(false);
          return;
        }

        // 1. Verify 6-digit OTP code with Supabase Auth
        const { data: verifyData, error: verifyError } =
          await supabase.auth.verifyOtp({
            email: parsed.data.email,
            token: parsed.data.code,
            type: "recovery",
          });

        if (verifyError || !verifyData?.session) {
          setError(
            verifyError?.message?.toLowerCase().includes("expired")
              ? t("auth.invalidOtpCode")
              : verifyError?.message ?? t("auth.invalidOtpCode"),
          );
          setPending(false);
          return;
        }

        // 2. Establish new password on verified recovery session
        const { error: updateError } = await supabase.auth.updateUser({
          password: parsed.data.password,
        });

        if (updateError) {
          setError(updateError.message);
          setPending(false);
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.fail"));
      setPending(false);
    }
  }

  return (
    <div className="wrap page grid items-center gap-8 lg:grid-cols-2">
      <div>
        <h1 className="page-title">{t("auth.resetPasswordTitle")}</h1>
        <p className="mt-4 text-ink-soft">
          {hasActiveSession
            ? t("auth.sessionVerifiedLead")
            : t("auth.resetPasswordLead")}
        </p>

        {!hasActiveSession && (
          <div className="mt-6 p-4 rounded-2xl bg-paper border border-line shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <IconClock className="w-4 h-4 text-forest" />
              <span>{t("auth.otpExpiresIn")}</span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {t("auth.otpCodeHelp")}
            </p>
          </div>
        )}
      </div>

      <div className="surface stack p-6">
        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-success/10 border border-success/20 p-5 text-success space-y-2">
              <div className="flex items-center gap-2 font-semibold text-base">
                <IconCheck className="w-5 h-5 shrink-0" />
                <span>{t("auth.passwordUpdated")}</span>
              </div>
              <p className="text-sm text-ink-soft">
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
          <form className="stack" onSubmit={onSubmit}>
            {/* If NO active session: Show Email & 6-digit OTP code inputs */}
            {!hasActiveSession && !checkingSession && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="email">{t("auth.email")}</label>
                  </div>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                    <IconMail className="w-4 h-4 text-ink-soft absolute top-3.5 rtl:left-3 ltr:right-3 pointer-events-none opacity-60" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="otp-code">{t("auth.otpCodeLabel")}</label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={cooldown > 0 || resending}
                      className="text-xs text-forest hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                    >
                      <IconRefresh
                        className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`}
                      />
                      <span>
                        {cooldown > 0
                          ? t("auth.resendOtpCooldown", { seconds: cooldown })
                          : t("auth.resendOtpBtn")}
                      </span>
                    </button>
                  </div>

                  <input
                    id="otp-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(val);
                    }}
                    placeholder={t("auth.otpCodePlaceholder")}
                    className="text-center font-mono text-2xl font-bold tracking-[0.35em] py-2.5"
                  />

                  {resendSuccess && (
                    <p className="mt-1.5 text-xs text-success font-medium">
                      {t("auth.otpResentSuccess")}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Password Inputs */}
            <div>
              <label htmlFor="password">{t("auth.newPassword")}</label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div>
              <label htmlFor="confirmPassword">
                {t("auth.confirmNewPassword")}
              </label>
              <div className="relative flex items-center">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full"
                  style={{ paddingInlineEnd: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword((prev) => !prev);
                  }}
                  className="absolute end-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:text-forest transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                  aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  title={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <IconEyeOff size={19} stroke={1.8} className="pointer-events-none" />
                  ) : (
                    <IconEye size={19} stroke={1.8} className="pointer-events-none" />
                  )}
                </button>
              </div>
            </div>

            {error && <p className="field-error">{error}</p>}

            <button className="btn btn-primary w-full" disabled={pending}>
              <PendingLabel
                pending={pending}
                idle={t("auth.updatePasswordBtn")}
                busy={t("auth.wait")}
              />
            </button>

            <p className="text-center text-sm text-ink-soft pt-1">
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
