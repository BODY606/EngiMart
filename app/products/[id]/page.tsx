import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImage } from "@/components/product-image";
import { hasPublicSupabaseConfig } from "@/lib/env";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatEgp } from "@/lib/money";
import { assertConfigured } from "@/lib/require-config";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/supabase/user";
import type { Product } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  if (!hasPublicSupabaseConfig()) return { title: "Product" };
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConfigured();
  const { id } = await params;
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  const supabase = await createClient();
  const [user, initialProductResult] = await Promise.all([
    getCachedUser(),
    supabase
      .from("products")
      .select("id, name, description, base_price, sale_price, image_url, is_available, created_at")
      .eq("id", id)
      .maybeSingle(),
  ]);

  let productResult = initialProductResult;
  if (
    productResult.error &&
    (productResult.error.code === "42703" ||
      productResult.error.message.includes("sale_price") ||
      productResult.error.message.includes("schema cache") ||
      productResult.error.message.includes("column"))
  ) {
    productResult = await supabase
      .from("products")
      .select("id, name, description, base_price, image_url, is_available, created_at")
      .eq("id", id)
      .maybeSingle();
  }

  const data = productResult.data;
  if (!data) notFound();
  const product = data as Product;

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
    <div className="wrap page grid gap-8 lg:grid-cols-2">
      <div className="crop-frame surface relative aspect-square overflow-hidden">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover"
        />
        {hasOffer && (
          <span className="absolute start-4 top-4 z-10 rounded-full bg-red-600 px-3.5 py-1 text-sm font-bold tracking-tight text-white shadow-md">
            {t("admin.discountBadge", { percent: discountPercent })}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <Link href="/" className="nav-link text-sm">
          {t("product.back")}
        </Link>
        <h1 className="page-title mt-4">{product.name}</h1>
        <p className="mt-4 text-ink-soft">{product.description}</p>
        <div className="mt-8">
          {hasOffer ? (
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="tabular text-3xl font-bold text-ink">
                  {formatEgp(product.sale_price!)}
                </span>
                <span className="tabular text-lg text-ink-soft line-through">
                  {formatEgp(product.base_price)}
                </span>
                <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  {t("admin.discountSavings", {
                    amount: formatEgp(
                      Number(product.base_price) - Number(product.sale_price),
                    ),
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink-soft">{t("product.basePrice")}</p>
              <p className="mt-2 tabular text-2xl font-medium">{formatEgp(product.base_price)}</p>
            </div>
          )}
          <p className="mt-2 text-sm text-ink-soft">{t("product.feeNote")}</p>
        </div>
        <div className="mt-8">
          <AddToCartButton
            product={product}
            loggedIn={Boolean(user)}
            nextPath={`/products/${product.id}`}
          />
        </div>
      </div>
    </div>
  );
}
