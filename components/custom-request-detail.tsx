"use client";

import { PriceBreakdownCard } from "@/components/price-breakdown";
import { PendingLabel } from "@/components/pending-label";
import { RemoveOwnRequestButton } from "@/components/remove-own-request";
import { formatEgp } from "@/lib/money";
import { openPreparedWhatsApp, prepareWhatsAppPopup } from "@/lib/open-whatsapp";
import { useT } from "@/lib/i18n/provider";
import type { CustomOrderRequest, PriceBreakdown } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomRequestDetail({
  request,
}: {
  request: CustomOrderRequest;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  const breakdown: PriceBreakdown | null =
    request.sourced_price != null &&
    request.service_fee != null &&
    request.total_price != null &&
    request.deposit_amount != null
      ? {
          subtotal: Number(request.sourced_price),
          serviceFee: Number(request.service_fee),
          total: Number(request.total_price),
          deposit: Number(request.deposit_amount),
          appliedTier: null,
        }
      : null;

  async function confirm() {
    setPending(true);
    setError(null);
    const popup = prepareWhatsAppPopup();
    const response = await fetch(`/api/custom-requests/${request.id}/confirm`, {
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      orderId?: string;
      whatsappUrl?: string;
    };
    if (!response.ok || !payload.orderId) {
      popup?.close();
      setError(payload.error || t("request.confirmFail"));
      setPending(false);
      return;
    }
    if (payload.whatsappUrl) {
      const openedInNewTab = openPreparedWhatsApp(popup, payload.whatsappUrl);
      if (!openedInNewTab) {
        setPending(false);
        return;
      }
    } else {
      popup?.close();
    }
    router.push(`/orders/${payload.orderId}`);
  }

  return (
    <div className="wrap page">
      <p className="text-sm text-ink-soft">{t(`status.${request.status}`)}</p>
      <h1 className="page-title mt-2">{t("request.heading")}</h1>
      <p className="mt-4 whitespace-pre-wrap text-ink-soft">{request.description}</p>
      {request.suggested_location && (
        <p className="mt-4 text-sm text-ink-soft">
          {t("request.location", { place: request.suggested_location })}
        </p>
      )}

      {request.status === "declined" && request.decline_reason ? (
        <p className="mt-4 text-sm text-ink-soft">
          {t("order.declineReason", { reason: request.decline_reason })}
        </p>
      ) : null}

      {request.status === "pending_review" && (
        <p className="mt-8 text-ink-soft">{t("request.waiting")}</p>
      )}

      {breakdown && (
        <div className="mt-8">
          <p className="mb-4 text-sm text-ink-soft">
            {t("request.sourced", { price: formatEgp(request.sourced_price) })}
          </p>
          <PriceBreakdownCard breakdown={breakdown} />
        </div>
      )}

      {request.status === "priced" && !request.order_id && (
        <button
          className="btn btn-primary mt-6"
          type="button"
          disabled={pending}
          onClick={() => void confirm()}
        >
          <PendingLabel
            pending={pending}
            idle={t("request.confirm")}
            busy={t("request.confirming")}
          />
        </button>
      )}
      {error && <p className="mt-4 field-error">{error}</p>}
      <div className="mt-8">
        <RemoveOwnRequestButton requestId={request.id} variant="button" />
      </div>
    </div>
  );
}
