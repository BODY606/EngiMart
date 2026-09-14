import { AdminProductsList } from "@/components/admin-products-list";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/types";
import Link from "next/link";

export default async function AdminProductsPage() {
  if (!(await isAdminAuthenticated())) return null;
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  const products = (data ?? []) as Product[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="admin-title">{t("admin.products")}</h1>
        <Link href="/admin/products/new" className="btn btn-primary">
          {t("admin.addProduct")}
        </Link>
      </div>
      <AdminProductsList products={products} />
    </div>
  );
}
