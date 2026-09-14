import { jsonError, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const supabase = await createClient();

  const { data, error: loadError } = await supabase
    .from("custom_order_requests")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (loadError) return jsonError(loadError.message, 500);
  if (!data) return jsonError("Request not found", 404);

  const { error } = await supabase
    .from("custom_order_requests")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
