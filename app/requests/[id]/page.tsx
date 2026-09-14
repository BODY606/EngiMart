import { CustomRequestDetail } from "@/components/custom-request-detail";
import { assertConfigured } from "@/lib/require-config";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/supabase/user";
import type { CustomOrderRequest } from "@/lib/types";
import { notFound, redirect } from "next/navigation";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConfigured();
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) redirect(`/login?next=/requests/${id}`);

  const { data } = await supabase
    .from("custom_order_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  return <CustomRequestDetail request={data as CustomOrderRequest} />;
}
