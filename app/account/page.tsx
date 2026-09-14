import { AccountPanel } from "@/components/account-panel";
import { accountInitials, accountLabel } from "@/lib/account-label";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { assertConfigured } from "@/lib/require-config";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/supabase/user";
import type { CustomOrderRequest, Order, OrderItem } from "@/lib/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type OrderWithItems = Order & {
  order_items: Pick<OrderItem, "product_name" | "quantity">[];
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  assertConfigured();
  const { tab: rawTab } = await searchParams;
  const locale = await getLocale();
  const translate = createT(getDictionary(locale));

  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) redirect("/login?next=/account");

  const [{ data: orders }, { data: requests }, { data: profile }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(product_name, quantity)")
        .order("created_at", { ascending: false }),
      supabase
        .from("custom_order_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);

  const name = accountLabel({
    fullName: profile?.full_name,
    metaName:
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      null,
    email: user.email,
  });
  const phone =
    profile?.phone ||
    (typeof user.user_metadata?.phone === "string" && user.user_metadata.phone) ||
    "—";
  const email = user.email ?? "—";
  const initials = accountInitials(name);

  return (
    <div className="wrap page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="page-title">{translate("account.title")}</h1>
        <form action="/auth/signout" method="post">
          <button className="btn btn-secondary" type="submit">
            {translate("account.signOut")}
          </button>
        </form>
      </div>

      <section className="account-card surface mt-8">
        <div className="account-avatar" aria-hidden>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="account-name">{name}</p>
          <p className="account-email">{email}</p>
          {phone !== "—" && (
            <p className="account-phone">
              {translate("account.phone")}: {phone}
            </p>
          )}
        </div>
      </section>

      <AccountPanel
        orders={(orders ?? []) as OrderWithItems[]}
        requests={(requests ?? []) as CustomOrderRequest[]}
        initialTab={rawTab ?? "ongoing"}
        locale={locale}
      />
    </div>
  );
}
