import { DeleteProductButton } from "@/components/admin-delete-product";
import { ProductForm } from "@/components/product-form";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) return null;
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const product = data as Product;
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-ink-soft">
        {t("admin.products")}
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="admin-title">{t("admin.editProduct")}</h1>
        <DeleteProductButton
          productId={product.id}
          productName={product.name}
          variant="button"
          redirectTo="/admin/products"
        />
      </div>
      <ProductForm product={product} />
    </div>
  );
}
