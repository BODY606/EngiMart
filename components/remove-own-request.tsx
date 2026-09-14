"use client";

import { IconTrash } from "@tabler/icons-react";
import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

export function RemoveOwnRequestButton({
  requestId,
  variant = "icon",
}: {
  requestId: string;
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRemove(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    if (!window.confirm(t("account.removeRequestConfirm"))) return;

    setPending(true);
    setError(null);
    const response = await fetch(`/api/custom-requests/${requestId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      const message = payload.error || t("account.removeRequestFail");
      setError(message);
      setPending(false);
      if (variant === "icon") window.alert(message);
      return;
    }
    if (variant === "button") {
      router.push("/account?tab=requests");
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
        aria-label={t("account.removeRequest")}
        title={t("account.removeRequest")}
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
          idle={t("account.removeRequest")}
          busy={t("admin.saving")}
        />
      </button>
      {error && <p className="mt-4 field-error">{error}</p>}
    </div>
  );
}
