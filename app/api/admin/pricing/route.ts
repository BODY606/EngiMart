import { requireAdmin } from "@/lib/admin-api";
import { jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { pricingUpdateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if ("response" in admin) return admin.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = pricingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid tiers");
  }

  const supabase = createAdminClient();
  const { error: deleteError } = await supabase
    .from("pricing_settings")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) return jsonError(deleteError.message, 500);

  const { error } = await supabase.from("pricing_settings").insert(
    parsed.data.tiers.map((tier, index) => ({
      tier_min: tier.tierMin,
      tier_max: tier.tierMax,
      fee_type: tier.feeType,
      fee_value: tier.feeValue,
      sort_order: tier.sortOrder ?? index,
    })),
  );
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
