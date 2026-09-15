import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductGallery } from "@/components/product-gallery";
import { hasPublicSupabaseConfig } from "@/lib/env";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatEgp } from "@/lib/money";
import { assertConfigured } from "@/lib/require-config";
import { createClient } from "@/lib/supabase/server";
import { getCachedUser } from "@/lib/supabase/user";
import type { Product } from "@/lib/types";
import { IconDownload, IconEye, IconFileTypePdf } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
      .select(
        "id, name, description, base_price, sale_price, image_url, images, pdf_url, is_available, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  let productData = initialProductResult.data as Product | null;

  if (
    initialProductResult.error &&
    (initialProductResult.error.code === "42703" ||
      initialProductResult.error.message.includes("images") ||
      initialProductResult.error.message.includes("pdf_url") ||
      initialProductResult.error.message.includes("schema cache") ||
      initialProductResult.error.message.includes("column"))
  ) {
    const fallbackRes = await supabase
      .from("products")
      .select("id, name, description, base_price, sale_price, image_url, is_available, created_at")
      .eq("id", id)
      .maybeSingle();

    if (
      fallbackRes.error &&
      (fallbackRes.error.code === "42703" ||
        fallbackRes.error.message.includes("sale_price") ||
        fallbackRes.error.message.includes("column"))
    ) {
      const minimalRes = await supabase
        .from("products")
        .select("id, name, description, base_price, image_url, is_available, created_at")
        .eq("id", id)
        .maybeSingle();
      productData = (minimalRes.data as unknown as Product) ?? null;
    } else {
      productData = (fallbackRes.data as unknown as Product) ?? null;
    }
  }

  if (!productData) notFound();
  const product = productData;

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
      <div>
        <ProductGallery
          images={product.images}
          fallbackImage={product.image_url}
          name={product.name}
          hasOffer={hasOffer}
          discountPercent={discountPercent}
          offerBadgeText={t("admin.discountBadge", { percent: discountPercent })}
        />
      </div>

      <div className="flex flex-col">
        <Link href="/" className="nav-link text-sm">
          {t("product.back")}
        </Link>
        <h1 className="page-title mt-4 break-words">{product.name}</h1>
        <div className="mt-4 text-ink-soft space-y-2 text-base leading-relaxed text-start" dir="auto">
          {product.description
            ? product.description
                .replaceAll("\r\n", "\n")
                .replaceAll("\r", "\n")
                .replaceAll("\\n", "\n")
                .split("\n")
                .map((line, idx) => (
                  <p key={idx} className={line.trim() === "" ? "h-3" : "min-h-[1.4em]"}>
                    {line}
                  </p>
                ))
            : null}
        </div>

        {/* PDF Datasheet / Specification Attachment */}
        {product.pdf_url && (
          <div className="mt-6 rounded-lg border border-line bg-paper/60 p-4 shadow-xs surface">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 rounded-md bg-red-500/10 p-2.5 text-red-600 dark:text-red-400">
                <IconFileTypePdf size={28} />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-ink">
                  {t("product.datasheet")}
                </h2>
                <p className="mt-1 text-xs text-ink-soft leading-normal">
                  {t("product.datasheetDesc")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={product.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-3"
                  >
                    <IconEye size={16} />
                    <span>{t("product.viewPdf")}</span>
                  </a>
                  <a
                    href={product.pdf_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary inline-flex items-center gap-1.5 text-xs py-1.5 px-3"
                  >
                    <IconDownload size={16} />
                    <span>{t("product.downloadPdf")}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

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
