"use client";

import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import type { PricingTier } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Draft = {
  key: string;
  tierMin: number;
  tierMax: number | null;
  feeType: "flat" | "percentage";
  feeValue: number;
  sortOrder: number;
};

function toDraft(tiers: PricingTier[]): Draft[] {
  return tiers.map((tier, index) => ({
    key: tier.id,
    tierMin: Number(tier.tier_min),
    tierMax: tier.tier_max === null ? null : Number(tier.tier_max),
    feeType: tier.fee_type,
    feeValue: Number(tier.fee_value),
    sortOrder: tier.sort_order ?? index,
  }));
}

export function PricingForm({ tiers }: { tiers: PricingTier[] }) {
  const router = useRouter();
  const t = useT();
  const [drafts, setDrafts] = useState<Draft[]>(() => toDraft(tiers));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(index: number, patch: Partial<Draft>) {
    setDrafts((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function describe(row: Draft) {
    const min = row.tierMin.toLocaleString("en-EG");
    const max =
      row.tierMax === null
        ? t("admin.andAbove")
        : row.tierMax.toLocaleString("en-EG");
    const fee =
      row.feeType === "flat"
        ? t("admin.flatFee", { n: row.feeValue.toLocaleString("en-EG") })
        : t("admin.percentFee", { n: row.feeValue });
    return t("admin.tierLine", { min, max, fee });
  }

  async function save() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tiers: drafts.map((row, index) => ({
          tierMin: row.tierMin,
          tierMax: row.tierMax,
          feeType: row.feeType,
          feeValue: row.feeValue,
          sortOrder: index,
        })),
      }),
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

  return (
    <div className="mt-6 space-y-4">
      {drafts.map((row, index) => (
        <div key={row.key} className="surface grid gap-4 p-4 sm:grid-cols-4">
          <div>
            <label>{t("admin.from")}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.tierMin}
              onChange={(event) =>
                update(index, { tierMin: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <label>{t("admin.upTo")}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.tierMax ?? ""}
              onChange={(event) =>
                update(index, {
                  tierMax:
                    event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </div>
          <div>
            <label>{t("admin.feeType")}</label>
            <select
              value={row.feeType}
              onChange={(event) =>
                update(index, {
                  feeType: event.target.value as Draft["feeType"],
                })
              }
            >
              <option value="flat">{t("admin.flat")}</option>
              <option value="percentage">{t("admin.percent")}</option>
            </select>
          </div>
          <div>
            <label>
              {row.feeType === "flat" ? t("admin.amount") : t("admin.percentLabel")}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.feeValue}
              onChange={(event) =>
                update(index, { feeValue: Number(event.target.value) })
              }
            />
          </div>
          <p className="text-xs text-ink-soft sm:col-span-4">{describe(row)}</p>
          {drafts.length > 1 && (
            <button
              className="text-start text-sm text-forest"
              type="button"
              onClick={() =>
                setDrafts((current) => current.filter((_, i) => i !== index))
              }
            >
              {t("admin.removeTier")}
            </button>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-4">
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() =>
            setDrafts((current) => [
              ...current,
              {
                key: crypto.randomUUID(),
                tierMin: 0,
                tierMax: null,
                feeType: "flat",
                feeValue: 0,
                sortOrder: current.length,
              },
            ])
          }
        >
          {t("admin.addTier")}
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={pending}
          onClick={() => void save()}
        >
          <PendingLabel
            pending={pending}
            idle={t("admin.savePricing")}
            busy={t("admin.saving")}
          />
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
