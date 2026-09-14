"use client";

import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AvailabilityToggle({
  productId,
  isAvailable,
}: {
  productId: string;
  isAvailable: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    router.refresh();
    setPending(false);
  }

  return (
    <button
      className="btn btn-secondary flex items-center gap-1.5"
      type="button"
      disabled={pending}
      onClick={() => void toggle()}
      title={isAvailable ? t("admin.available") : t("admin.unavailable")}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          isAvailable ? "bg-emerald-500" : "bg-zinc-400"
        }`}
        aria-hidden="true"
      />
      <PendingLabel
        pending={pending}
        idle={isAvailable ? t("admin.available") : t("admin.unavailable")}
        busy={t("admin.saving")}
      />
    </button>
  );
}
