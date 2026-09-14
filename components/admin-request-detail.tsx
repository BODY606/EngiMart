"use client";

import { DeclineReasonDialog } from "@/components/decline-reason-dialog";
import { PendingLabel } from "@/components/pending-label";
import { RemoveRequestButton } from "@/components/admin-remove-request";
import { formatEgp } from "@/lib/money";
import { useT } from "@/lib/i18n/provider";
import type { CustomOrderRequest, Profile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminRequestDetail({
  request,
  student,
}: {
  request: CustomOrderRequest;
  student: Profile | null;
}) {
  const router = useRouter();
  const t = useT();
  const [price, setPrice] = useState(
    request.sourced_price != null ? String(request.sourced_price) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState(
    request.decline_reason ?? "",
  );

  async function savePrice() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourcedPrice: Number(price) }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || t("auth.fail"));
      setPending(false);
      return;
    }
    router.refresh();
    setPending(false);
  }

  async function setStatus(
    status: "approved" | "declined" | "completed",
    reason?: string,
  ) {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        declineReason: status === "declined" ? reason?.trim() || null : null,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || t("auth.fail"));
      setPending(false);
      return;
    }
    setDeclineOpen(false);
    setDeclineReason("");
    router.refresh();
    setPending(false);
  }

  return (
    <div>
      <p className="text-sm text-ink-soft">{t(`status.${request.status}`)}</p>
      <h1 className="admin-title mt-2">{t("admin.customRequest")}</h1>
      <p className="mt-4 whitespace-pre-wrap text-ink-soft">{request.description}</p>
      {request.suggested_location && (
        <p className="mt-4 text-sm text-ink-soft">
          {t("request.location", { place: request.suggested_location })}
        </p>
      )}
      <p className="mt-4 text-sm">
        {student?.full_name} · <span className="tabular">{student?.phone}</span>
      </p>

      <div className="surface mt-8 p-6">
        <label htmlFor="sourcedPrice">{t("admin.sourcedPrice")}</label>
        <input
          id="sourcedPrice"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <p className="mt-2 text-sm text-ink-soft">{t("admin.sourcedHelp")}</p>
        {request.total_price != null && (
          <p className="mt-4 tabular text-sm">
            {t("admin.feeTotalDeposit", {
              fee: formatEgp(request.service_fee),
              total: formatEgp(request.total_price),
              deposit: formatEgp(request.deposit_amount),
            })}
          </p>
        )}
        <button
          className="btn btn-primary mt-4"
          type="button"
          disabled={pending || price === ""}
          onClick={() => void savePrice()}
        >
          <PendingLabel
            pending={pending}
            idle={t("admin.setPrice")}
            busy={t("admin.saving")}
          />
        </button>
      </div>

      {request.status === "declined" && request.decline_reason ? (
        <p className="mt-4 text-sm text-ink-soft">
          {t("order.declineReason", { reason: request.decline_reason })}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-4">
        <button
          className="btn btn-primary"
          type="button"
          disabled={pending}
          onClick={() => void setStatus("approved")}
        >
          {t("admin.approve")}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={pending}
          onClick={() => {
            setDeclineReason(request.decline_reason ?? "");
            setDeclineOpen(true);
          }}
        >
          {t("admin.decline")}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={pending}
          onClick={() => void setStatus("completed")}
        >
          {t("admin.completed")}
        </button>
      </div>
      <DeclineReasonDialog
        open={declineOpen}
        reason={declineReason}
        pending={pending}
        onReasonChange={setDeclineReason}
        onConfirm={() => void setStatus("declined", declineReason)}
        onCancel={() => {
          if (pending) return;
          setDeclineOpen(false);
        }}
      />
      {request.order_id && (
        <p className="mt-4 text-sm">
          {t("admin.linked")}{" "}
          <a className="text-forest" href={`/admin/orders/${request.order_id}`}>
            {t("admin.open")}
          </a>
        </p>
      )}
      {error && <p className="mt-4 field-error">{error}</p>}
      <div className="mt-4">
        <RemoveRequestButton requestId={request.id} redirectTo="/admin/requests" />
      </div>
    </div>
  );
}
