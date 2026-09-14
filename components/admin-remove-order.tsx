"use client";

import { IconTrash } from "@tabler/icons-react";
import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

export function RemoveOrderButton({
  orderId,
  variant = "button",
  redirectTo,
}: {
  orderId: string;
  variant?: "icon" | "button";
  redirectTo?: string;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRemove(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    if (!window.confirm(t("admin.removeOrderConfirm"))) return;

    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      const message = payload.error || t("admin.removeFail");
      setError(message);
      setPending(false);
      if (variant === "icon") window.alert(message);
      return;
    }
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }
    router.refresh();
    setPending(false);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        className="icon-btn text-danger"
        aria-label={t("admin.remove")}
        title={t("admin.remove")}
        disabled={pending}
        onClick={(event) => void onRemove(event)}
      >
        <IconTrash size={16} stroke={1.75} />
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary text-danger"
        disabled={pending}
        onClick={(event) => void onRemove(event)}
      >
        <PendingLabel
          pending={pending}
          idle={t("admin.remove")}
          busy={t("admin.saving")}
        />
      </button>
      {error && <p className="mt-4 field-error">{error}</p>}
    </div>
  );
}
