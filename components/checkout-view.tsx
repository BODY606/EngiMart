"use client";

import { PriceBreakdownCard } from "@/components/price-breakdown";
import { PendingLabel } from "@/components/pending-label";
import { useCart } from "@/components/cart-provider";
import { formatEgp } from "@/lib/money";
import { openPreparedWhatsApp, prepareWhatsAppPopup } from "@/lib/open-whatsapp";
import { calculateBreakdown } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import type { PricingTier } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function CheckoutView() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [placed, setPlaced] = useState(false);
  const t = useT();

  useEffect(() => {
    if (placed || pending) return;
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, pending, placed, router]);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("pricing_settings")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setTiers((data ?? []) as PricingTier[]));
  }, []);

  const breakdown = useMemo(
    () => calculateBreakdown(subtotal, tiers),
    [subtotal, tiers],
  );

  async function confirm() {
    setPending(true);
    setError(null);
    const popup = prepareWhatsAppPopup();
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        orderId?: string;
        whatsappUrl?: string;
      };
      if (!response.ok || !payload.orderId) {
        popup?.close();
        setError(payload.error || t("checkout.fail"));
        return;
      }
      setPlaced(true);
      clear();
      if (payload.whatsappUrl) {
        openPreparedWhatsApp(popup, payload.whatsappUrl);
      } else {
        popup?.close();
      }
      router.push(`/orders/${payload.orderId}`);
    } catch {
      popup?.close();
      setError(t("checkout.fail"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="wrap page grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
      <div>
        <h1 className="page-title">{t("checkout.title")}</h1>
        <p className="mt-4 text-ink-soft">{t("checkout.lead")}</p>
        <ul className="surface list-panel mt-8">
          {items.map((line) => (
            <li key={line.productId} className="list-row text-sm">
              <span>
                {line.name}{" "}
                <span className="text-ink-soft">× {line.quantity}</span>
              </span>
              <span className="tabular">
                {formatEgp(line.basePrice * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit lg:sticky lg:top-16">
        <PriceBreakdownCard
          breakdown={breakdown}
          action={
            <>
              {error && <p className="field-error mb-4">{error}</p>}
              <button
                className="btn btn-primary w-full"
                type="button"
                disabled={pending || items.length === 0}
                onClick={() => void confirm()}
              >
                <PendingLabel
                  pending={pending}
                  idle={t("checkout.confirm")}
                  busy={t("checkout.placing")}
                />
              </button>
            </>
          }
        />
      </aside>
    </div>
  );
}
