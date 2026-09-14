"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { useT } from "@/lib/i18n/provider";
import type { Product } from "@/lib/types";
import type { CSSProperties } from "react";

type MarqueeItem = {
  href: string;
  src: string | null;
  name: string;
  id: string;
};

export function ProductMarquee({ products }: { products: Product[] }) {
  const t = useT();
  if (!products || products.length === 0) return null;

  const stock = products.filter((item) => item.is_available);
  const items: MarqueeItem[] = (stock.length > 0 ? stock : products).map((item) => ({
    href: `/products/${item.id}`,
    src: item.image_url,
    name: item.name,
    id: item.id,
  }));

  if (items.length === 0) return null;

  const minItems = 6;
  const copies = Math.max(2, Math.ceil(minItems / items.length) * 2);
  const loop = Array.from({ length: copies }, () => items).flat();
  const seconds = Math.max(items.length, 6) * 4;

  return (
    <section className="home-marquee-section" aria-label={t("home.marqueeAria")}>
      <div
        className="home-marquee"
        style={{ "--marquee-duration": `${seconds}s` } as CSSProperties}
      >
        <div className="home-marquee-track">
          {loop.map((item, index) => (
            <Link
              key={`${item.id}-${index}`}
              href={item.href}
              className="home-marquee-item"
              tabIndex={index >= items.length ? -1 : undefined}
              aria-hidden={index >= items.length ? true : undefined}
            >
              <span className="home-marquee-thumb">
                <ProductImage
                  src={item.src}
                  alt={index >= items.length ? "" : item.name}
                  sizes="80px"
                  className="object-cover"
                />
              </span>
              <span className="home-marquee-name">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
