import { CartView } from "@/components/cart-view";
import { assertConfigured } from "@/lib/require-config";
import { getCachedUser } from "@/lib/supabase/user";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  assertConfigured();
  const user = await getCachedUser();
  return <CartView loggedIn={Boolean(user)} />;
}
