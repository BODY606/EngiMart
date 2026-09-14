"use client";

import { PriceBreakdownCard } from "@/components/price-breakdown";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";
import { useCart } from "@/components/cart-provider";
import { formatEgp } from "@/lib/money";
import { calculateBreakdown } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import type { PricingTier } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function CartView({ loggedIn }: { loggedIn: boolean }) {
  const { items, subtotal, setQuantity, remove } = useCart();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const t = useT();

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

  if (items.length === 0) {
    return (
      <div className="wrap page">
        <h1 className="page-title">{t("cart.title")}</h1>
        <p className="mt-4 text-ink-soft">{t("cart.empty")}</p>
        <Link href="/" className="btn btn-primary mt-8">
          {t("cart.browse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap page grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
      <div>
        <h1 className="page-title">{t("cart.title")}</h1>
        <ul className="surface list-panel mt-8">
          {items.map((line) => (
            <li key={line.productId} className="list-row cart-line">
              <div className="flex min-w-0 flex-1 gap-4">
                <div className="thumb">
                  <ProductImage
                    src={line.imageUrl}
                    alt=""
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{line.name}</p>
                  <p className="mt-1 tabular text-sm text-ink-soft">
                    {t("cart.each", { price: formatEgp(line.basePrice) })}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(qty) => setQuantity(line.productId, qty)}
                    />
                    <button
                      className="text-sm text-ink-soft hover:text-ink"
                      type="button"
                      onClick={() => remove(line.productId)}
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
              </div>
              <p className="tabular font-medium">
                {formatEgp(line.basePrice * line.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit lg:sticky lg:top-16">
        <PriceBreakdownCard
          breakdown={breakdown}
          action={
            loggedIn ? (
              <Link href="/checkout" className="btn btn-primary w-full">
                {t("cart.checkout")}
              </Link>
            ) : (
              <Link href="/login?next=/cart" className="btn btn-primary w-full">
                {t("cart.signIn")}
              </Link>
            )
          }
        />
      </aside>
    </div>
  );
}
