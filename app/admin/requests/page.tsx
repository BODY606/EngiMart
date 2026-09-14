import { AdminRequestsList } from "@/components/admin-requests-list";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomOrderRequest } from "@/lib/types";

export default async function AdminRequestsPage() {
  if (!(await isAdminAuthenticated())) return null;
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("custom_order_requests")
    .select("*")
    .eq("hidden_from_admin", false)
    .order("created_at", { ascending: false });
  const requests = ((data ?? []) as CustomOrderRequest[]).filter(
    (request) => !request.hidden_from_admin,
  );

  const userIds = [...new Set(requests.map((request) => request.user_id))];
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
      <h1 className="admin-title">{t("admin.requests")}</h1>
      <AdminRequestsList requests={requests} names={names} locale={locale} />
    </div>
  );
}
