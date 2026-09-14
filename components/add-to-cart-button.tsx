"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useT } from "@/lib/i18n/provider";
import type { Product } from "@/lib/types";

export function AddToCartButton({
  product,
  loggedIn,
  nextPath,
}: {
  product: Product;
  loggedIn: boolean;
  nextPath: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const t = useT();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  if (!product.is_available) {
    return (
      <button className="btn btn-secondary w-full" disabled>
        {t("product.currentlyUnavailable")}
      </button>
    );
  }

  return (
    <button
      className="btn btn-primary w-full"
      type="button"
      onClick={() => {
        if (!loggedIn) {
          router.push(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }
        add(product);
        setAdded(true);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? t("product.added") : t("product.addToCart")}
    </button>
  );
}
