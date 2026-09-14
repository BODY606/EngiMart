import { CheckoutView } from "@/components/checkout-view";
import { assertConfigured } from "@/lib/require-config";
import { getCachedUser } from "@/lib/supabase/user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  assertConfigured();
  const user = await getCachedUser();
  if (!user) redirect("/login?next=/checkout");
  return <CheckoutView />;
}
