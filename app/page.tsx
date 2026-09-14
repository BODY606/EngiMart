import { HomeHow, HomeHeroPhoto, HomeShowcase } from "@/components/home-visuals";
import { ProductCatalog } from "@/components/product-catalog";
import { ProductMarquee } from "@/components/product-marquee";
import { hasPublicSupabaseConfig } from "@/lib/env";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCatalogProducts } from "@/lib/catalog-products";
import { getCachedUser } from "@/lib/supabase/user";
import Link from "next/link";

export default async function HomePage() {
  const configured = hasPublicSupabaseConfig();
  const locale = await getLocale();
  const t = createT(getDictionary(locale));

  if (!configured) {
    return (
      <div className="wrap page">
        <p className="eyebrow">{t("home.setup")}</p>
        <h1 className="mt-6 font-serif text-4xl">{t("home.setupTitle")}</h1>
        <p className="mt-6 text-ink-soft">{t("home.setupLead")}</p>
      </div>
    );
  }

  const [user, products] = await Promise.all([
    getCachedUser(),
    getCatalogProducts(),
  ]);

  return (
    <div>
      <section className="home-hero">
        <div className="wrap page home-hero-grid">
          <div>
            <p className="eyebrow">{t("home.eyebrow")}</p>
            <h1 className="mt-6 font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
              {t("home.title1")}
              <br />
              {t("home.title2")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-ink-soft">{t("home.lead")}</p>
            <div className="mt-12 flex flex-wrap gap-4">
              <a href="#catalog" className="btn btn-primary">
                {t("home.browse")}
              </a>
              <Link href="/request" className="btn btn-secondary">
                {t("home.needOther")}
              </Link>
            </div>
          </div>
          <HomeHeroPhoto t={t} />
        </div>
      </section>

      <HomeShowcase t={t} />
      <HomeHow t={t} />
      <ProductMarquee products={products} />

      <section id="catalog" className="wrap page">
        <div className="mb-12 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t("home.catalog")}</p>
            <h2 className="mt-2 font-serif text-3xl">{t("home.bench")}</h2>
          </div>
          <p className="hidden text-sm text-ink-soft sm:block">
            {t("home.parts", { n: products.length })}
          </p>
        </div>
        {products.length === 0 ? (
          <p className="text-ink-soft">{t("home.empty")}</p>
        ) : (
          <ProductCatalog products={products} loggedIn={Boolean(user)} />
        )}
      </section>
    </div>
  );
}
