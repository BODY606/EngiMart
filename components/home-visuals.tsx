import { ZoomFrame } from "@/components/zoom-frame";
import type { Translate } from "@/lib/i18n";
import Link from "next/link";

function PhotoOrnaments({ variant }: { variant: "hero" | "a" | "b" | "c" }) {
  return (
    <div className={`home-ornaments home-ornaments-${variant}`} aria-hidden="true">
      <span className="home-ornament home-ornament-dots" />
      {variant === "b" ? (
        <span className="home-ornament home-ornament-hex" />
      ) : (
        <span className="home-ornament home-ornament-glow" />
      )}
    </div>
  );
}

const spots = [
  {
    src: "/home/hero-bench.png",
    alt: "home.photoBench",
    shape: "circle",
    variant: "a",
    title: "home.spot1Title",
    lead: "home.spot1Lead",
    cta: "home.spot1Cta",
    href: "#catalog",
  },
  {
    src: "/home/hero-tools.png",
    alt: "home.photoTools",
    shape: "blob",
    variant: "b",
    title: "home.spot2Title",
    lead: "home.spot2Lead",
    cta: "home.spot2Cta",
    href: "#catalog",
  },
  {
    src: "/home/hero-sensors.png",
    alt: "home.photoSensors",
    shape: "blob-alt",
    variant: "c",
    title: "home.spot3Title",
    lead: "home.spot3Lead",
    cta: "home.spot3Cta",
    href: "/request",
  },
] as const;

export function HomeHeroPhoto({ t }: { t: Translate }) {
  return (
    <div className="home-hero-frame">
      <PhotoOrnaments variant="hero" />
      <ZoomFrame className="home-hero-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/home/hero-bench.png"
          alt={t("home.photoBench")}
          className="home-photo-img"
        />
      </ZoomFrame>
    </div>
  );
}

export function HomeShowcase({ t }: { t: Translate }) {
  return (
    <section className="home-showcase">
      <span className="home-showcase-wash" aria-hidden="true" />
      <div className="wrap home-showcase-inner">
        <p className="eyebrow">{t("home.gallery")}</p>
        <h2 className="mt-2 font-serif text-3xl">{t("home.galleryTitle")}</h2>
        <div className="home-showcase-rows">
          {spots.map((spot) => {
            const cta =
              spot.href.startsWith("#") ? (
                <a href={spot.href} className="btn btn-primary">
                  {t(spot.cta)}
                </a>
              ) : (
                <Link href={spot.href} className="btn btn-primary">
                  {t(spot.cta)}
                </Link>
              );

            return (
              <article
                key={spot.src}
                className={`home-showcase-row home-showcase-row-${spot.variant}`}
              >
                <div className={`home-showcase-media home-shape-${spot.shape}`}>
                  <PhotoOrnaments variant={spot.variant} />
                  <ZoomFrame className="home-showcase-crop">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={spot.src}
                      alt={t(spot.alt)}
                      className="home-photo-img"
                    />
                  </ZoomFrame>
                </div>
                <div className="home-showcase-copy">
                  <h3 className="font-serif text-3xl leading-tight">
                    {t(spot.title)}
                  </h3>
                  <p>{t(spot.lead)}</p>
                  <div className="mt-8">{cta}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeHow({ t }: { t: Translate }) {
  const steps = [
    { title: "home.step1Title", body: "home.step1" },
    { title: "home.step2Title", body: "home.step2" },
    { title: "home.step3Title", body: "home.step3" },
  ] as const;

  return (
    <section className="home-how">
      <div className="wrap">
        <p className="eyebrow">{t("home.how")}</p>
        <h2 className="mt-2 font-serif text-3xl">{t("home.howTitle")}</h2>
        <ol className="home-how-grid">
          {steps.map((step, index) => (
            <li key={step.title} className="home-how-card">
              <span className="home-how-num">0{index + 1}</span>
              <h3>{t(step.title)}</h3>
              <p>{t(step.body)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
