import { jsonError, requireUser } from "@/lib/api";
import { calculateBreakdown } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CustomOrderRequest, PricingTier } from "@/lib/types";
import { orderWhatsAppUrl } from "@/lib/whatsapp";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("custom_order_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const row = request as CustomOrderRequest | null;
  if (!row || row.user_id !== auth.user.id) {
    return jsonError("Request not found", 404);
  }
  if (row.status !== "priced" || row.sourced_price == null) {
    return jsonError("This request has not been priced yet");
  }
  if (row.order_id) {
    const { data: existing } = await supabase
      .from("orders")
      .select("*")
      .eq("id", row.order_id)
      .maybeSingle();
    const whatsappUrl = await whatsappUrlForCustomOrder({
      user: auth.user,
      supabase,
      orderId: row.order_id,
      orderNumber: existing?.order_number ?? null,
      description: row.description,
      breakdown: {
        subtotal: Number(row.sourced_price),
        serviceFee: Number(row.service_fee ?? 0),
        total: Number(row.total_price ?? 0),
        deposit: Number(row.deposit_amount ?? 0),
      },
    });
    return NextResponse.json({ orderId: row.order_id, whatsappUrl });
  }

  const admin = createAdminClient();
  const { data: tiers } = await admin
    .from("pricing_settings")
    .select("*")
    .order("sort_order");
  const breakdown = calculateBreakdown(
    Number(row.sourced_price),
    (tiers ?? []) as PricingTier[],
  );

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: auth.user.id,
      status: "pending",
      items_subtotal: breakdown.subtotal,
      service_fee: breakdown.serviceFee,
      total_price: breakdown.total,
      deposit_amount: breakdown.deposit,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    return jsonError(orderError?.message ?? "Could not create order", 500);
  }

  const { error: itemError } = await admin.from("order_items").insert({
    order_id: order.id,
    product_id: null,
    product_name: row.description.slice(0, 120),
    quantity: 1,
    unit_base_price_at_order_time: breakdown.subtotal,
  });
  if (itemError) return jsonError(itemError.message, 500);

  const { error: updateError } = await admin
    .from("custom_order_requests")
    .update({
      order_id: order.id,
      service_fee: breakdown.serviceFee,
      total_price: breakdown.total,
      deposit_amount: breakdown.deposit,
    })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (updateError) return jsonError(updateError.message, 500);

  const whatsappUrl = await whatsappUrlForCustomOrder({
    user: auth.user,
    supabase,
    orderId: order.id,
    orderNumber: order.order_number,
    description: row.description,
    breakdown,
  });
  return NextResponse.json({ orderId: order.id, whatsappUrl });
}

async function whatsappUrlForCustomOrder({
  user,
  supabase,
  orderId,
  orderNumber,
  description,
  breakdown,
}: {
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
  orderId: string;
  orderNumber?: number | null;
  description: string;
  breakdown: { subtotal: number; serviceFee: number; total: number; deposit: number };
}) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const studentName =
    profile?.full_name ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    user.email ||
    "Customer";
  const studentPhone =
    profile?.phone || (typeof meta?.phone === "string" && meta.phone) || "";

  return orderWhatsAppUrl({
    studentName,
    studentPhone,
    items: [
      {
        name: description.slice(0, 120),
        quantity: 1,
        unitPrice: breakdown.subtotal,
      },
    ],
    subtotal: breakdown.subtotal,
    serviceFee: breakdown.serviceFee,
    total: breakdown.total,
    deposit: breakdown.deposit,
    orderId,
    orderNumber,
  });
}
