"use client";

import { formatEgp } from "@/lib/money";
import { useT } from "@/lib/i18n/provider";
import type { PriceBreakdown } from "@/lib/types";
import type { ReactNode } from "react";

export function PriceBreakdownCard({
  breakdown,
  action,
}: {
  breakdown: PriceBreakdown;
  compact?: boolean;
  action?: ReactNode;
}) {
  const t = useT();

  return (
    <div className="surface p-6">
      <p className="section-title">{t("price.title")}</p>
      <div className="mt-6 flex flex-col gap-4 text-sm">
        <div className="price-row">
          <span className="text-ink-soft">{t("price.subtotal")}</span>
          <span className="tabular">{formatEgp(breakdown.subtotal)}</span>
        </div>
        <div className="price-row">
          <span className="text-ink-soft">{t("price.fee")}</span>
          <span className="tabular">{formatEgp(breakdown.serviceFee)}</span>
        </div>
        <div className="price-row border-t border-line pt-4 font-medium">
          <span>{t("price.total")}</span>
          <span className="tabular">{formatEgp(breakdown.total)}</span>
        </div>
        <div className="price-row text-forest">
          <span>{t("price.deposit")}</span>
          <span className="tabular">{formatEgp(breakdown.deposit)}</span>
        </div>
      </div>
      {action ? <div className="price-card-action">{action}</div> : null}
    </div>
  );
}
