import { AdminOrdersList } from "@/components/admin-orders-list";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  if (!(await isAdminAuthenticated())) return null;
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("hidden_from_admin", false)
    .order("created_at", { ascending: false });
  const orders = ((data ?? []) as Order[]).filter(
    (order) => !order.hidden_from_admin,
  );

  const userIds = [...new Set(orders.map((order) => order.user_id))];
  const names: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    for (const profile of profiles ?? []) {
      names[profile.id] = profile.full_name;
    }
  }

  return (
    <div>
      <h1 className="admin-title">{t("admin.orders")}</h1>
      <AdminOrdersList
        orders={orders}
        names={names}
        status={status}
        locale={locale}
      />
    </div>
  );
}
