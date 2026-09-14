import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import Link from "next/link";

export default async function NotFound() {
  const locale = await getLocale();
  const t = createT(getDictionary(locale));

  return (
    <div className="wrap page">
      <p className="text-sm text-ink-soft">{t("notFound.code")}</p>
      <h1 className="page-title mt-4">{t("notFound.title")}</h1>
      <Link href="/" className="btn btn-primary mt-8">
        {t("notFound.back")}
      </Link>
    </div>
  );
}
