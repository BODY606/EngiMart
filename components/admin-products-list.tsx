"use client";

import { AdminEmpty } from "@/components/admin-empty";
import { AdminSearch } from "@/components/admin-search";
import { AvailabilityToggle } from "@/components/availability-toggle";
import { DeleteProductButton } from "@/components/admin-delete-product";
import { matchesProduct } from "@/lib/admin-search";
import { formatEgp } from "@/lib/money";
import { useT } from "@/lib/i18n/provider";
import type { Product } from "@/lib/types";
import { IconExternalLink, IconFileTypePdf, IconPencil, IconPhoto } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function AdminProductsList({ products }: { products: Product[] }) {
  const t = useT();
  const [items, setItems] = useState(products);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setItems(products);
  }, [products]);

  const filtered = useMemo(
    () => items.filter((product) => matchesProduct(product, query)),
    [items, query],
  );

  return (
    <>
      <AdminSearch
        value={query}
        onChange={setQuery}
        placeholder={t("admin.searchProducts")}
        label={t("admin.searchProducts")}
      />
      <div className="mt-6">
        {products.length === 0 ? (
          <AdminEmpty
            icon="products"
            title={t("admin.emptyProducts")}
            copy={t("admin.emptyProductsCopy")}
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            icon="products"
            title={t("admin.noSearchResults")}
            copy={t("admin.noSearchResultsCopy")}
          />
        ) : (
          <div className="surface overflow-hidden">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-4 last:border-b-0"
              >
                <div className="thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url || "/products/fallback.svg"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{product.name}</p>
                    {product.pdf_url && (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">
                        <IconFileTypePdf size={12} />
                        PDF
                      </span>
                    )}
                    {product.images && product.images.length > 1 && (
                      <span className="inline-flex items-center gap-1 rounded bg-line/60 px-1.5 py-0.5 text-[11px] text-ink-soft">
                        <IconPhoto size={12} />
                        {product.images.length}
                      </span>
                    )}
                  </div>
                  {product.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                      {product.description}
                    </p>
                  ) : null}
                  {product.sale_price !== null &&
                  product.sale_price !== undefined &&
                  Number(product.sale_price) > 0 &&
                  Number(product.sale_price) < Number(product.base_price) ? (
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="tabular font-bold text-ink">
                        {formatEgp(product.sale_price)}
                      </span>
                      <span className="tabular text-xs text-ink-soft line-through">
                        {formatEgp(product.base_price)}
                      </span>
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
                        {t("admin.discountBadge", {
                          percent: Math.round(
                            ((Number(product.base_price) -
                              Number(product.sale_price)) /
                              Number(product.base_price)) *
                              100,
                          ),
                        })}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 tabular text-sm text-ink-soft">
                      {formatEgp(product.base_price)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {product.source_url ? (
                    <a
                      href={product.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      title={t("admin.buyFromSource")}
                    >
                      <IconExternalLink size={16} stroke={1.6} />
                      <span className="hidden sm:inline">{t("admin.buyFromSource")}</span>
                    </a>
                  ) : null}
                  <AvailabilityToggle
                    productId={product.id}
                    isAvailable={product.is_available}
                  />
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="btn btn-secondary"
                  >
                    <IconPencil size={16} stroke={1.6} />
                    {t("admin.edit")}
                  </Link>
                  <DeleteProductButton
                    productId={product.id}
                    productName={product.name}
                    onDeleted={() =>
                      setItems((prev) => prev.filter((p) => p.id !== product.id))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
