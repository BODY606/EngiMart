import { getSiteUrl, getWhatsAppPhone } from "@/lib/env";
import { formatEgp } from "@/lib/money";
import { formatOrderNumber } from "@/lib/order-number";

type WhatsAppOrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

type WhatsAppOrderPayload = {
  studentName: string;
  studentPhone: string;
  items: WhatsAppOrderItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  deposit: number;
  orderId: string;
  orderNumber?: number | null;
  siteUrl?: string;
};

export function normalizeWhatsAppPhone(phone = getWhatsAppPhone()): string {
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0020")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("01") && digits.length === 11) {
    digits = `20${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppUrl(message: string, phone = getWhatsAppPhone()): string {
  const digits = normalizeWhatsAppPhone(phone);
  const text = encodeURIComponent(message);
  if (!digits) return `https://wa.me/?text=${text}`;
  return `https://wa.me/${digits}?text=${text}`;
}

export function formatWhatsAppDisplay(phone = getWhatsAppPhone()): string {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return "";
  if (digits.startsWith("20") && digits.length >= 11) {
    const national = digits.slice(2);
    return `+20 ${national.slice(0, 2)} ${national.slice(2, 6)} ${national.slice(6)}`.trim();
  }
  return `+${digits}`;
}

function buildOrderWhatsAppMessage(payload: WhatsAppOrderPayload): string {
  const site = (payload.siteUrl ?? getSiteUrl()).replace(/\/$/, "");
  const lines = payload.items.map((item) => {
    const lineTotal = item.unitPrice * item.quantity;
    return `• ${item.name} × ${item.quantity} — ${formatEgp(lineTotal)}`;
  });

  const heading = formatOrderNumber(payload.orderNumber)
    ? `EngiMart order ${formatOrderNumber(payload.orderNumber)}`
    : "EngiMart order";

  return [
    heading,
    "",
    `Name: ${payload.studentName}`,
    `Phone: ${payload.studentPhone}`,
    "",
    "Items:",
    ...lines,
    "",
    `Items: ${formatEgp(payload.subtotal)}`,
    `Service fee: ${formatEgp(payload.serviceFee)}`,
    `Total: ${formatEgp(payload.total)}`,
    `Deposit (50%): ${formatEgp(payload.deposit)}`,
    "",
    "I will send the deposit screenshot in this chat (Vodafone Cash / InstaPay).",
    "",
    `Order page: ${site}/admin/orders/${payload.orderId}`,
  ].join("\n");
}

export function orderWhatsAppUrl(payload: WhatsAppOrderPayload): string {
  return buildWhatsAppUrl(buildOrderWhatsAppMessage(payload));
}
