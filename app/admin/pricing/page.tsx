import { PricingForm } from "@/components/pricing-form";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PricingTier } from "@/lib/types";

export default async function AdminPricingPage() {
  if (!(await isAdminAuthenticated())) return null;
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("pricing_settings")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <h1 className="admin-title">{t("admin.pricingTitle")}</h1>
      <p className="mt-4 text-sm text-ink-soft">{t("admin.pricingLead")}</p>
      <PricingForm tiers={(data ?? []) as PricingTier[]} />
    </div>
  );
}
