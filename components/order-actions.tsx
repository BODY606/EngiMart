"use client";

import { DeclineReasonDialog } from "@/components/decline-reason-dialog";
import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@/lib/types";

export function OrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const t = useT();
  const [optimistic, setOptimistic] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const current = optimistic ?? status;

  async function setStatus(next: OrderStatus, reason?: string) {
    setOptimistic(next);
    setPending(next);
    setError(null);
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: next,
        declineReason: next === "declined" ? reason?.trim() || null : null,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || t("auth.fail"));
      setOptimistic(null);
      setPending(null);
      return;
    }
    setDeclineOpen(false);
    setDeclineReason("");
    router.refresh();
    setPending(null);
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {current === "pending" && (
          <button
            className="btn btn-secondary"
            type="button"
            disabled={Boolean(pending)}
            onClick={() => void setStatus("deposit_paid")}
          >
            <PendingLabel
              pending={pending === "deposit_paid"}
              idle={t("admin.depositPaid")}
              busy={t("admin.saving")}
            />
          </button>
        )}
        {current !== "approved" && current !== "completed" && current !== "declined" && (
          <button
            className="btn btn-primary"
            type="button"
            disabled={Boolean(pending)}
            onClick={() => void setStatus("approved")}
          >
            <PendingLabel
              pending={pending === "approved"}
              idle={t("admin.approve")}
              busy={t("admin.saving")}
            />
          </button>
        )}
        {current !== "declined" && current !== "completed" && (
          <button
            className="btn btn-secondary"
            type="button"
            disabled={Boolean(pending)}
            onClick={() => setDeclineOpen(true)}
          >
            {t("admin.decline")}
          </button>
        )}
        {current === "approved" && (
          <button
            className="btn btn-primary"
            type="button"
            disabled={Boolean(pending)}
            onClick={() => void setStatus("completed")}
          >
            <PendingLabel
              pending={pending === "completed"}
              idle={t("admin.markCompleted")}
              busy={t("admin.saving")}
            />
          </button>
        )}
      </div>
      <DeclineReasonDialog
        open={declineOpen && current !== "declined"}
        reason={declineReason}
        pending={pending === "declined"}
        onReasonChange={setDeclineReason}
        onConfirm={() => void setStatus("declined", declineReason)}
        onCancel={() => {
          if (pending) return;
          setDeclineOpen(false);
        }}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
