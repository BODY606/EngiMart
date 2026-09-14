"use client";

import { IconTrash } from "@tabler/icons-react";
import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

export function DeleteProductButton({
  productId,
  productName,
  variant = "icon",
  redirectTo,
  onDeleted,
}: {
  productId: string;
  productName?: string;
  variant?: "icon" | "button";
  redirectTo?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    const confirmMsg = productName
      ? `${t("admin.deleteProductConfirm")}\n\n«${productName}»`
      : t("admin.deleteProductConfirm");

    if (!window.confirm(confirmMsg)) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        const message = payload.error || t("admin.deleteFail");
        setError(message);
        setPending(false);
        if (variant === "icon") window.alert(message);
        return;
      }

      if (onDeleted) {
        onDeleted();
      }

      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      router.refresh();
      setPending(false);
    } catch {
      const message = t("admin.deleteFail");
      setError(message);
      setPending(false);
      if (variant === "icon") window.alert(message);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        className="icon-btn text-danger hover:bg-danger/10"
        aria-label={t("admin.deleteProduct")}
        title={t("admin.deleteProduct")}
        disabled={pending}
        onClick={(event) => void onDelete(event)}
      >
        <IconTrash size={16} stroke={1.75} />
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary text-danger hover:bg-danger/10"
        disabled={pending}
        onClick={(event) => void onDelete(event)}
      >
        <PendingLabel
          pending={pending}
          idle={t("admin.deleteProduct")}
          busy={t("admin.deleting")}
        />
      </button>
      {error && <p className="mt-4 field-error">{error}</p>}
    </div>
  );
}
