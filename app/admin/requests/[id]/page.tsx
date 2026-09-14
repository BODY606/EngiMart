import { AdminRequestDetail } from "@/components/admin-request-detail";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomOrderRequest, Profile } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function AdminRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) return null;
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("custom_order_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data || (data as CustomOrderRequest).hidden_from_admin) notFound();
  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user_id)
    .maybeSingle();

  return (
    <AdminRequestDetail
      request={data as CustomOrderRequest}
      student={(student as Profile | null) ?? null}
    />
  );
}
