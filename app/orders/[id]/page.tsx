import { OrderConfirmation } from "@/components/order-confirmation";
import { assertConfigured } from "@/lib/require-config";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/supabase/user";
import type { Order, OrderItem } from "@/lib/types";
import { orderWhatsAppUrl } from "@/lib/whatsapp";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConfigured();
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCachedUser();
  if (!user) redirect(`/login?next=/orders/${id}`);

  const [{ data: order }, { data: items }, { data: profile }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);
  if (!order) notFound();

  const studentName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    "Customer";
  const studentPhone =
    profile?.phone ||
    (user.user_metadata?.phone as string | undefined) ||
    "";
  const orderItems = (items ?? []) as OrderItem[];
  const placed = order as Order;

  const whatsappUrl = orderWhatsAppUrl({
    studentName,
    studentPhone,
    items: orderItems.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_base_price_at_order_time),
    })),
    subtotal: Number(placed.items_subtotal),
    serviceFee: Number(placed.service_fee),
    total: Number(placed.total_price),
    deposit: Number(placed.deposit_amount),
    orderId: placed.id,
    orderNumber: placed.order_number,
  });

  return (
    <OrderConfirmation
      order={placed}
      items={orderItems}
      whatsappUrl={whatsappUrl}
    />
  );
}
