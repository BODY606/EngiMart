import { requireAdmin } from "@/lib/admin-api";
import { jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderStatusSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  status: orderStatusSchema,
  declineReason: z.string().trim().max(500).optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if ("response" in admin) return admin.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid status");

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "declined") {
    updates.decline_reason = parsed.data.declineReason?.trim() || null;
  } else {
    updates.decline_reason = null;
  }
  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if ("response" in admin) return admin.response;
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (loadError) return jsonError(loadError.message, 500);
  if (!order) return jsonError("Order not found", 404);

  const { error } = await supabase
    .from("orders")
    .update({ hidden_from_admin: true })
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
