import { requireAdmin } from "@/lib/admin-api";
import { jsonError } from "@/lib/api";
import { calculateBreakdown } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PricingTier } from "@/lib/types";
import { customStatusSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  sourcedPrice: z.coerce.number().min(0).optional(),
  status: customStatusSchema.optional(),
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
  if (!parsed.success) return jsonError("Invalid payload");

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {};

  if (parsed.data.sourcedPrice !== undefined) {
    const { data: tiers } = await supabase
      .from("pricing_settings")
      .select("*")
      .order("sort_order");
    const breakdown = calculateBreakdown(
      parsed.data.sourcedPrice,
      (tiers ?? []) as PricingTier[],
    );
    updates.sourced_price = breakdown.subtotal;
    updates.service_fee = breakdown.serviceFee;
    updates.total_price = breakdown.total;
    updates.deposit_amount = breakdown.deposit;
    updates.status = "priced";
    updates.decline_reason = null;
  }

  if (parsed.data.status) {
    updates.status = parsed.data.status;
    if (parsed.data.status === "declined") {
      updates.decline_reason = parsed.data.declineReason?.trim() || null;
    } else {
      updates.decline_reason = null;
    }
  }

  const { error } = await supabase
    .from("custom_order_requests")
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
  const { data, error: loadError } = await supabase
    .from("custom_order_requests")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (loadError) return jsonError(loadError.message, 500);
  if (!data) return jsonError("Request not found", 404);

  const { error } = await supabase
    .from("custom_order_requests")
    .update({ hidden_from_admin: true })
    .eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
