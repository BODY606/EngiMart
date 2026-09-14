"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImage } from "@/components/product-image";
import { formatEgp } from "@/lib/money";
import { useT } from "@/lib/i18n/provider";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  loggedIn,
  priority = false,
}: {
  product: Product;
  loggedIn: boolean;
  priority?: boolean;
}) {
  const t = useT();
  const hasOffer =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    Number(product.sale_price) > 0 &&
    Number(product.sale_price) < Number(product.base_price);

  const discountPercent = hasOffer
    ? Math.round(
        ((Number(product.base_price) - Number(product.sale_price)) /
          Number(product.base_price)) *
          100,
      )
    : 0;

  return (
    <article className="surface group flex flex-col overflow-hidden">
      <Link href={`/products/${product.id}`} className="crop-frame block">
        <div className="relative aspect-[4/3] overflow-hidden bg-paper">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {hasOffer && product.is_available && (
            <span className="absolute start-3 top-3 z-10 inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold tracking-tight text-white shadow-md">
              {t("admin.discountBadge", { percent: discountPercent })}
            </span>
          )}
          {!product.is_available && (
            <span className="absolute end-3 top-3 z-10 rounded bg-ink/90 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-paper backdrop-blur-xs">
              {t("product.unavailable")}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <Link href={`/products/${product.id}`}>
            <h3 className="text-lg font-medium leading-tight group-hover:text-accent transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
            {product.description}
          </p>
        </div>
        <div className="mt-auto">
          {hasOffer ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="tabular text-xl font-bold text-ink">
                {formatEgp(product.sale_price!)}
              </span>
              <span className="tabular text-sm text-ink-soft line-through">
                {formatEgp(product.base_price)}
              </span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-ink-soft">{t("product.basePrice")}</p>
              <p className="tabular text-lg font-semibold text-ink">{formatEgp(product.base_price)}</p>
            </div>
          )}
        </div>
        <AddToCartButton
          product={product}
          loggedIn={loggedIn}
          nextPath={`/products/${product.id}`}
        />
      </div>
    </article>
  );
}
