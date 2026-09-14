"use client";

import { LocalDateTime } from "@/components/local-datetime";
import { PriceBreakdownCard } from "@/components/price-breakdown";
import { formatEgp } from "@/lib/money";
import { formatOrderNumber } from "@/lib/order-number";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { Order, OrderItem, PriceBreakdown } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderConfirmation({
  order,
  items,
  whatsappUrl,
}: {
  order: Order;
  items: OrderItem[];
  whatsappUrl: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const locale = useLocale();

  const breakdown: PriceBreakdown = {
    subtotal: Number(order.items_subtotal),
    serviceFee: Number(order.service_fee),
    total: Number(order.total_price),
    deposit: Number(order.deposit_amount),
    appliedTier: null,
  };

  async function onProof(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/orders/${order.id}/proof`, {
      method: "POST",
      body,
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || t("order.uploadFail"));
      setUploading(false);
      return;
    }
    router.refresh();
    setUploading(false);
  }

  return (
    <div className="wrap page">
      <p className="text-sm font-medium tabular">
        {formatOrderNumber(order.order_number)
          ? t("order.number", { number: formatOrderNumber(order.order_number) })
          : null}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {t(`status.${order.status}`)}
        {" · "}
        <LocalDateTime iso={order.created_at} locale={locale} />
      </p>
      {order.status === "declined" && order.decline_reason ? (
        <p className="surface mt-4 p-4 text-sm">
          {t("order.declineReason", { reason: order.decline_reason })}
        </p>
      ) : null}
      <h1 className="page-title mt-2">
        {t("order.depositDue", { price: formatEgp(order.deposit_amount) })}
      </h1>
      <p className="mt-4 text-ink-soft">{t("order.lead")}</p>
      <ul className="surface list-panel mt-8 text-sm">
        {items.map((item) => (
          <li key={item.id} className="list-row">
            <span>
              {item.product_name}{" "}
              <span className="text-ink-soft">× {item.quantity}</span>
            </span>
            <span className="tabular">
              {formatEgp(
                Number(item.unit_base_price_at_order_time) * item.quantity,
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <PriceBreakdownCard breakdown={breakdown} />
      </div>
      <a
        href={whatsappUrl}
        className="btn btn-primary mt-6 w-full"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("order.whatsapp")}
      </a>
      <div className="surface mt-6 p-6">
        <p className="font-medium text-ink">{t("order.proofTitle")}</p>
        <p className="mt-2 text-sm text-ink-soft">{t("order.proofLead")}</p>
        <input
          className="mt-4"
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(event) => void onProof(event.target.files?.[0] ?? null)}
        />
        {order.transfer_proof_url && (
          <p className="field-ok mt-4">{t("order.attached")}</p>
        )}
        {error && <p className="field-error mt-4">{error}</p>}
      </div>
    </div>
  );
}
