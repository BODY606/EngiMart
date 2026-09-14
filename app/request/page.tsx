import { CustomRequestForm } from "@/components/custom-request-form";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { assertConfigured } from "@/lib/require-config";
import { getCachedUser } from "@/lib/supabase/user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RequestPage() {
  assertConfigured();
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  const user = await getCachedUser();
  if (!user) redirect("/login?next=/request");

  return (
    <div className="wrap page">
      <h1 className="page-title">{t("request.title")}</h1>
      <p className="mt-4 text-ink-soft">{t("request.lead")}</p>
      <CustomRequestForm />
    </div>
  );
}
