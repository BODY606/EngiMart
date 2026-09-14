import { ProductForm } from "@/components/product-form";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function NewProductPage() {
  if (!(await isAdminAuthenticated())) return null;
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  return (
    <div>
      <h1 className="admin-title">{t("admin.newProduct")}</h1>
      <ProductForm />
    </div>
  );
}
