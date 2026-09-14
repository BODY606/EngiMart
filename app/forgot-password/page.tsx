import { AuthForm } from "@/components/auth-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <AuthForm mode="forgot" />
    </Suspense>
  );
}
