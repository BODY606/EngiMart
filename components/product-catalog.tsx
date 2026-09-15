"use client";

import Fuse from "fuse.js";
import { useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { useSearchQuery } from "@/components/search-query";
import { useT } from "@/lib/i18n/provider";
import type { Product } from "@/lib/types";
import {
  expandSearchTerms,
  generateProductSearchTokens,
  matchesProductBilingual,
} from "@/lib/bilingual-search";

type IndexedProduct = Product & {
  searchTokens: string;
};

export function ProductCatalog({
  products,
  loggedIn,
}: {
  products: Product[];
  loggedIn: boolean;
}) {
  const t = useT();
  const { query } = useSearchQuery();

  const indexedProducts = useMemo<IndexedProduct[]>(
    () =>
      products.map((p) => ({
        ...p,
        searchTokens: generateProductSearchTokens(p.name, p.description || ""),
      })),
    [products],
  );

  const fuse = useMemo(
    () =>
      new Fuse(indexedProducts, {
        keys: [
          { name: "name", weight: 0.5 },
          { name: "searchTokens", weight: 0.35 },
          { name: "description", weight: 0.15 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [indexedProducts],
  );

  const { list, note } = useMemo(() => {
    const q = query.trim();
    if (!q) return { list: products, note: null as string | null };

    // 1. Direct and Bilingual Dictionary Matches (Highest priority)
    const directMatches = products.filter((product) =>
      matchesProductBilingual(
        product.name,
        product.description || "",
        product.base_price,
        q,
      ),
    );

    if (directMatches.length > 0) {
      return {
        list: directMatches,
        note: null,
      };
    }

    // 2. Fuzzy Fuse.js search across original query and expanded bilingual terms
    const expandedTerms = expandSearchTerms(q);
    const seenIds = new Set<string>();
    const fuzzyResults: Product[] = [];

    // Search with original query first
    const primaryFuse = fuse.search(q);
    for (const r of primaryFuse) {
      if (!seenIds.has(r.item.id)) {
        seenIds.add(r.item.id);
        fuzzyResults.push(r.item);
      }
    }

    // Search with other expanded terms if results are sparse
    for (const term of expandedTerms) {
      if (term.toLowerCase() === q.toLowerCase()) continue;
      const termResults = fuse.search(term);
      for (const r of termResults) {
        if (!seenIds.has(r.item.id)) {
          seenIds.add(r.item.id);
          fuzzyResults.push(r.item);
        }
      }
    }

    if (fuzzyResults.length > 0) {
      return {
        list: fuzzyResults,
        note: t("catalog.closest", { q }),
      };
    }

    // 3. Very loose fallback search
    const looseFuse = new Fuse(indexedProducts, {
      keys: [
        { name: "name", weight: 0.5 },
        { name: "searchTokens", weight: 0.35 },
        { name: "description", weight: 0.15 },
      ],
      threshold: 0.75,
      ignoreLocation: true,
    });

    const loose = looseFuse.search(q);
    if (loose.length > 0) {
      return {
        list: loose.map((r) => r.item),
        note: t("catalog.noExact", { q }),
      };
    }

    // 4. Fallback when nothing found
    return {
      list: products.slice(0, 6),
      note: t("catalog.nothing", { q }),
    };
  }, [fuse, indexedProducts, products, query, t]);

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
