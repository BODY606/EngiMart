"use client";

import { isAdminPath } from "@/lib/admin-config";
import { forgotPasswordSchema, loginSchema, signupSchema } from "@/lib/validations";
import { PendingLabel } from "@/components/pending-label";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import { useAuth } from "@/components/auth-context";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconCircleCheck,
  IconClock,
  IconCompass,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconShoppingCart,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthForm({
  mode: propMode = "login",
}: {
  mode?: "login" | "signup" | "forgot";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const confirmed = searchParams.get("confirmed") === "true";
  const resetFailed = searchParams.get("resetFailed") === "true";
  const errorCode = searchParams.get("error");
  const emailParam = searchParams.get("email") || "";
  const [currentMode, setCurrentMode] = useState<"login" | "signup" | "forgot">(
    propMode,
  );
  const [confirmationSentEmail, setConfirmationSentEmail] = useState<string | null>(null);
  const [confirmationOtpCode, setConfirmationOtpCode] = useState("");
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [confirmationResendCooldown, setConfirmationResendCooldown] = useState(0);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [resendConfirmationSuccess, setResendConfirmationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState(emailParam);
  const [showPassword, setShowPassword] = useState(false);
  const t = useT();
  const { loggedIn, isEmailConfirmed } = useAuth();

  useEffect(() => {
    if (emailParam) {
      setEmailInput(emailParam);
    }
  }, [emailParam]);

  // Handle URL hash fragments (e.g. from email confirmation links on mobile)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token")
    ) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          try {
            document.cookie = "em_guest_session=1; path=/; SameSite=Lax";
          } catch {
            // ignore
          }
          const dest =
            next && next !== "/login" && next !== "/signup" ? next : "/";
          window.location.assign(dest);
        }
      });
    }
  }, [next]);

  useEffect(() => {
    if (confirmationResendCooldown <= 0) return;
    const interval = setInterval(() => {
      setConfirmationResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [confirmationResendCooldown]);

  async function handleVerifyConfirmationOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmationSentEmail) return;

    const cleanCode = confirmationOtpCode.trim();
    if (cleanCode.length !== 6) {
      setConfirmationError(t("auth.enterConfirmCode"));
      return;
    }

    setConfirmationError(null);
    setConfirmationPending(true);

    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: confirmationSentEmail,
        token: cleanCode,
        type: "signup",
      });

      if (verifyError || !data?.session) {
        setConfirmationError(
          verifyError?.message?.toLowerCase().includes("expired")
            ? t("auth.invalidOtpCode")
            : verifyError?.message ?? t("auth.invalidOtpCode"),
        );
        setConfirmationPending(false);
        return;
      }

      try {
        document.cookie = "em_guest_session=1; path=/; SameSite=Lax";
        document.cookie =
          "electromart_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch {
        // ignore
      }

      const dest = next && next !== "/login" && next !== "/signup" ? next : "/";
      window.location.assign(dest);
    } catch (err) {
      setConfirmationError(err instanceof Error ? err.message : t("auth.fail"));
      setConfirmationPending(false);
    }
  }

  async function handleResendConfirmationOtp() {
    if (!confirmationSentEmail || confirmationResendCooldown > 0 || resendingConfirmation) {
      return;
    }

    setConfirmationError(null);
    setResendingConfirmation(true);
    setResendConfirmationSuccess(false);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: confirmationSentEmail,
      });

      if (resendError) {
        setConfirmationError(resendError.message);
      } else {
        setResendConfirmationSuccess(true);
        setConfirmationResendCooldown(60);
      }
    } catch (err) {
      setConfirmationError(err instanceof Error ? err.message : t("auth.fail"));
    } finally {
      setResendingConfirmation(false);
    }
  }

  // If already logged in with confirmed email, redirect away from auth page
  useEffect(() => {
    if (loggedIn && isEmailConfirmed && !errorCode && !resetFailed && !confirmationSentEmail) {
      router.replace(
        next && next !== "/login" && next !== "/signup" ? next : "/",
      );
    }
  }, [loggedIn, isEmailConfirmed, next, router, errorCode, resetFailed, confirmationSentEmail]);

  const target =
    next &&
    next !== "/login" &&
    next !== "/signup" &&
    !isAdminPath(next) &&
    !next.startsWith("/account") &&
    !next.startsWith("/orders")
      ? next
      : "/";

  const handleBrowseAsGuest = () => {
    try {
      document.cookie = "em_guest_session=1; path=/; SameSite=Lax";
      document.cookie =
        "electromart_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch {
      // ignore
    }
    const destination = target;
    const sep = destination.includes("?") ? "&" : "?";
    window.location.assign(`${destination}${sep}browse=1`);
  };

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
      const redirectTo = `${origin}/auth/callback?next=/reset-password&email=${encodeURIComponent(parsed.data.email)}`;

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
      router.push(`/reset-password?email=${encodeURIComponent(parsed.data.email)}`);
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

        const origin =
          typeof window !== "undefined"
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || "";
        const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
          next && next !== "/login" && next !== "/signup" ? next : "/",
        )}&email=${encodeURIComponent(parsed.data.email)}`;

        const { data: signData, error: signError } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo,
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

        if (signData.user && !signData.session) {
          setConfirmationSentEmail(parsed.data.email);
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
          if (
            signError.message.toLowerCase().includes("email not confirmed") ||
            signError.message.toLowerCase().includes("not confirmed")
          ) {
            setError(t("auth.emailNotConfirmed"));
          } else {
            setError(signError.message);
          }
          setPending(false);
          return;
        }
      }

      try {
        document.cookie = "em_guest_session=1; path=/; SameSite=Lax";
        document.cookie =
          "electromart_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch {
        // ignore
      }
      const target =
        next && next !== "/login" && next !== "/signup" ? next : "/";
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.fail"));
      setPending(false);
    }
  }

  if (confirmationSentEmail) {
    return (
      <div className="wrap page grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h1 className="page-title">{t("auth.confirmationTitle")}</h1>
          <p className="mt-4 text-ink-soft">
            {t("auth.confirmationLead", { email: confirmationSentEmail })}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-paper border border-line shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <IconClock className="w-4 h-4 text-forest" />
              <span>{t("auth.otpExpiresIn")}</span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {t("auth.confirmationSpamHint")}
            </p>
          </div>
        </div>

        <div className="surface stack p-6 space-y-4">
          {confirmationError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <IconAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{confirmationError}</span>
            </div>
          )}

          {resendConfirmationSuccess && (
            <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-success text-sm flex items-center gap-2">
              <IconCircleCheck className="w-4 h-4 shrink-0" />
              <span>{t("auth.confirmOtpResentSuccess")}</span>
            </div>
          )}

          <form className="stack" onSubmit={handleVerifyConfirmationOtp}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="confirm-otp-code">{t("auth.enterConfirmCode")}</label>
                <button
                  type="button"
                  onClick={handleResendConfirmationOtp}
                  disabled={confirmationResendCooldown > 0 || resendingConfirmation}
                  className="text-xs text-forest hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                >
                  <IconRefresh
                    className={`w-3.5 h-3.5 ${resendingConfirmation ? "animate-spin" : ""}`}
                  />
                  <span>
                    {confirmationResendCooldown > 0
                      ? t("auth.resendOtpCooldown", { seconds: confirmationResendCooldown })
                      : t("auth.resendConfirmOtp")}
                  </span>
                </button>
              </div>

              <input
                id="confirm-otp-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={confirmationOtpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setConfirmationOtpCode(val);
                }}
                placeholder="123456"
                className="text-center font-mono text-2xl font-bold tracking-[0.35em] py-2.5"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={confirmationPending || confirmationOtpCode.length !== 6}
            >
              <PendingLabel
                pending={confirmationPending}
                idle={t("auth.confirmOtpBtn")}
                busy={t("auth.wait")}
              />
            </button>
          </form>

          <div className="pt-2 flex flex-col gap-2 border-t border-line/60">
            <button
              type="button"
              className="btn btn-secondary w-full text-center"
              onClick={() => {
                setConfirmationSentEmail(null);
                setConfirmationOtpCode("");
                setConfirmationError(null);
                setCurrentMode("signup");
              }}
            >
              {t("auth.changeEmail")}
            </button>
            <button
              type="button"
              className="text-xs text-ink-soft hover:underline text-center py-1"
              onClick={() => {
                setConfirmationSentEmail(null);
                setConfirmationOtpCode("");
                setConfirmationError(null);
                setCurrentMode("login");
              }}
            >
              {t("auth.goToLogin")}
            </button>
          </div>
        </div>
      </div>
    );
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
              <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-success">
                <p className="font-semibold">{t("auth.resetLinkSent")}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {t("auth.resetLinkSentLead", { email: sentEmail })}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={`/reset-password?email=${encodeURIComponent(sentEmail)}`}
                  className="btn btn-primary w-full text-center"
                >
                  {t("auth.enterCodeInstead")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSentEmail(null);
                    setError(null);
                    setCurrentMode("login");
                  }}
                  className="btn btn-secondary w-full text-center"
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

        {/* Guest Browse Option Card */}
        <div className="mt-6 p-4 rounded-2xl bg-paper border border-line shadow-xs space-y-2">
          <p className="text-sm font-bold text-ink flex items-center gap-2">
            <IconCompass className="w-4 h-4 text-forest" />
            <span>{t("auth.exploreFirst")}</span>
          </p>
          <p className="text-xs text-ink-soft leading-relaxed">
            {t("auth.exploreFirstDesc")}
          </p>
          <button
            type="button"
            onClick={handleBrowseAsGuest}
            className="text-xs font-semibold text-forest hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>{t("auth.browseAsGuest")}</span>
            <IconArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <form
          className="surface stack p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void onAuthSubmit(new FormData(event.currentTarget));
        }}
      >
        {/* Email confirmed success banner */}
        {currentMode === "login" && confirmed && (
          <div
            role="status"
            className="rounded-xl bg-success/15 border border-success/30 p-4 text-success flex items-start gap-3 shadow-xs"
          >
            <IconCircleCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium leading-relaxed">
              {t("auth.emailConfirmedSuccess")}
            </div>
          </div>
        )}

        {/* Password reset link expired / invalid warning banner */}
        {currentMode === "login" && resetFailed && (
          <div
            role="alert"
            className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs"
          >
            <IconAlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-2 text-sm leading-relaxed">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {t("auth.resetLinkExpired")}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80">
                {t("auth.resetFailedEnterCodeHint")}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/reset-password${emailParam ? `?email=${encodeURIComponent(emailParam)}` : ""}`}
                  className="btn btn-primary text-xs inline-flex items-center gap-1.5 py-1.5 px-3 font-medium cursor-pointer shadow-xs"
                >
                  <span>{t("auth.enterCodeInstead")}</span>
                  <IconArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                </Link>
                <Link
                  href={`/forgot-password${emailParam ? `?email=${encodeURIComponent(emailParam)}` : ""}`}
                  onClick={() => {
                    setError(null);
                    setCurrentMode("forgot");
                  }}
                  className="btn btn-secondary text-xs inline-flex items-center gap-1.5 py-1.5 px-3 font-medium bg-paper/80 hover:bg-paper cursor-pointer border border-amber-500/30 text-ink shadow-2xs"
                >
                  <span>{t("auth.requestNewResetLink")}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Visible error banner for query param errors (never swallow errors) */}
        {currentMode === "login" && !confirmed && !resetFailed && errorCode && (
          <div
            role="alert"
            className="rounded-xl bg-accent/10 border border-accent/25 p-4 text-ink flex items-start gap-3 shadow-xs text-sm"
          >
            <IconAlertCircle className="w-5 h-5 shrink-0 text-accent mt-0.5" />
            <div className="space-y-2">
              <div>
                {errorCode === "email-not-confirmed"
                  ? t("auth.emailNotConfirmed")
                  : errorCode === "auth-code-error"
                    ? t("auth.authCodeError")
                    : t("auth.fail")}
              </div>
              {errorCode === "email-not-confirmed" && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationSentEmail(emailInput || "");
                    setError(null);
                  }}
                  className="btn btn-secondary text-xs inline-flex items-center gap-1.5 py-1 px-3 font-semibold cursor-pointer"
                >
                  <span>{t("auth.enterConfirmCode")}</span>
                  <IconArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                </button>
              )}
            </div>
          </div>
        )}
        {/* Cart checkout reminder if arrived from cart/checkout */}
        {next.startsWith("/checkout") && (
          <div className="rounded-xl bg-forest/10 border border-forest/20 p-3.5 text-forest text-xs flex items-center gap-2.5">
            <IconShoppingCart className="w-5 h-5 shrink-0 text-forest" />
            <div>
              <p className="font-semibold text-ink">
                {currentMode === "signup"
                  ? t("auth.cartSignupPrompt")
                  : t("auth.cartLoginPrompt")}
              </p>
              <p className="text-[11px] text-ink-soft mt-0.5">
                {t("auth.cartPromptHint")}
              </p>
            </div>
          </div>
        )}

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
          <div className="relative flex items-center">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={currentMode === "login" ? "current-password" : "new-password"}
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
              className="absolute end-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:text-forest transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
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
        {error && (
          <div>
            <p className="field-error">{error}</p>
            {error === t("auth.emailNotConfirmed") && emailInput && (
              <button
                type="button"
                onClick={() => {
                  setConfirmationSentEmail(emailInput);
                  setError(null);
                }}
                className="mt-2 text-xs text-forest hover:underline font-semibold cursor-pointer block"
              >
                {t("auth.enterConfirmCode")} ⬅️
              </button>
            )}
          </div>
        )}
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
                prefetch={false}
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
                prefetch={false}
              >
                {t("auth.signIn")}
              </Link>
            </>
          )}
        </p>
      </form>

      {/* Guest Browsing Action - 100% OUTSIDE the form */}
      <div className="surface p-4 text-center rounded-2xl border border-line shadow-xs space-y-2">
        <p className="text-xs text-ink-soft">
          {t("auth.browseAsGuestHint")}
        </p>
        <button
          type="button"
          id="guest-browse-btn"
          onClick={handleBrowseAsGuest}
          className="btn btn-secondary w-full flex items-center justify-center gap-2 group hover:border-forest hover:bg-forest/5 transition-all cursor-pointer font-semibold py-3 shadow-xs text-sm"
        >
          <IconCompass className="w-5 h-5 text-forest transition-transform group-hover:rotate-45" />
          <span>{t("auth.browseAsGuest")}</span>
          <IconArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180 transition-transform group-hover:-translate-x-1" />
        </button>
      </div>
    </div>
  </div>
);
}
