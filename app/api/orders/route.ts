import { jsonError, requireUser } from "@/lib/api";
import { calculateBreakdown } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import type { PricingTier, Product } from "@/lib/types";
import { checkoutSchema } from "@/lib/validations";
import { orderWhatsAppUrl } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid cart");
  }

  const supabase = await createClient();
  const ids = parsed.data.items.map((item) => item.productId);
  let { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, base_price, sale_price, is_available")
    .in("id", ids);

  if (
    productError &&
    (productError.code === "42703" ||
      productError.message.includes("sale_price") ||
      productError.message.includes("schema cache") ||
      productError.message.includes("column"))
  ) {
    const fallbackRes = await supabase
      .from("products")
      .select("id, name, base_price, is_available")
      .in("id", ids);
    products = (fallbackRes.data as unknown as typeof products) ?? null;
    productError = fallbackRes.error;
  }

  if (productError) return jsonError(productError.message, 500);
  const catalog = (products ?? []) as Product[];
  const byId = new Map(catalog.map((product) => [product.id, product]));

  const lines = [];
  for (const item of parsed.data.items) {
    const product = byId.get(item.productId);
    if (!product) return jsonError("A product in your cart is no longer listed");
    if (!product.is_available) {
      return jsonError(`${product.name} is currently unavailable`);
    }
    const unitPrice =
      product.sale_price !== null &&
      product.sale_price !== undefined &&
      Number(product.sale_price) > 0 &&
      Number(product.sale_price) < Number(product.base_price)
        ? Number(product.sale_price)
        : Number(product.base_price);

    lines.push({
      product,
      quantity: item.quantity,
      unitPrice,
    });
  }

  const { data: tiers, error: tierError } = await supabase
    .from("pricing_settings")
    .select("*")
    .order("sort_order");
  if (tierError) return jsonError(tierError.message, 500);

  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const breakdown = calculateBreakdown(subtotal, (tiers ?? []) as PricingTier[]);

  const { data: order, error: orderError } = await supabase
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

  const { error: itemsError } = await supabase.from("order_items").insert(
    lines.map((line) => ({
      order_id: order.id,
      product_id: line.product.id,
      product_name: line.product.name,
      quantity: line.quantity,
      unit_base_price_at_order_time: line.unitPrice,
    })),
  );

  if (itemsError) {
    return jsonError(itemsError.message, 500);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", auth.user.id)
    .maybeSingle();
  const meta = auth.user.user_metadata as Record<string, unknown> | undefined;
  const studentName =
    profile?.full_name ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    auth.user.email ||
    "Customer";
  const studentPhone =
    profile?.phone ||
    (typeof meta?.phone === "string" && meta.phone) ||
    "";

  const whatsappUrl = orderWhatsAppUrl({
    studentName,
    studentPhone,
    items: lines.map((line) => ({
      name: line.product.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    subtotal: breakdown.subtotal,
    serviceFee: breakdown.serviceFee,
    total: breakdown.total,
    deposit: breakdown.deposit,
    orderId: order.id,
    orderNumber: order.order_number,
  });

  return NextResponse.json({ orderId: order.id, whatsappUrl });
}
