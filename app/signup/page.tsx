import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
