"use client";

import Fuse from "fuse.js";
import { useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { useSearchQuery } from "@/components/search-query";
import { useT } from "@/lib/i18n/provider";
import type { Product } from "@/lib/types";

export function ProductCatalog({
  products,
  loggedIn,
}: {
  products: Product[];
  loggedIn: boolean;
}) {
  const t = useT();
  const { query } = useSearchQuery();
  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ["name", "description"],
        threshold: 0.38,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [products],
  );

  const { list, note } = useMemo(() => {
    const q = query.trim();
    if (!q) return { list: products, note: null as string | null };

    const tight = fuse.search(q);
    if (tight.length > 0) {
      return {
        list: tight.map((r) => r.item),
        note:
          tight[0].score && tight[0].score > 0.12
            ? t("catalog.closest", { q })
            : null,
      };
    }

    const loose = new Fuse(products, {
      keys: ["name", "description"],
      threshold: 0.8,
      ignoreLocation: true,
    }).search(q);

    if (loose.length > 0) {
      return {
        list: loose.map((r) => r.item),
        note: t("catalog.noExact", { q }),
      };
    }

    return {
      list: products.slice(0, 6),
      note: t("catalog.nothing", { q }),
    };
  }, [fuse, products, query, t]);

  return (
    <section>
      {note && <p className="mb-4 text-sm text-ink-soft">{note}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((product, index) => (
          <div
            key={product.id}
            className="rise-in"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <ProductCard
              product={product}
              loggedIn={loggedIn}
              priority={index < 3}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
