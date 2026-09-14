"use client";

import { getContactEmail, getWhatsAppPhone } from "@/lib/env";
import { useT } from "@/lib/i18n/provider";
import { buildWhatsAppUrl, formatWhatsAppDisplay } from "@/lib/whatsapp";
import { IconBrandWhatsapp, IconMail, IconMapPin } from "@tabler/icons-react";
import Link from "next/link";

export function SiteFooter() {
  const t = useT();
  const email = getContactEmail();
  const phone = getWhatsAppPhone();
  const phoneLabel = formatWhatsAppDisplay(phone);
  const whatsappHref = phone
    ? buildWhatsAppUrl(t("footer.whatsappMessage"), phone)
    : "";

  return (
    <footer className="site-footer">
      <div className="wrap site-footer-grid">
        <div className="site-footer-brand">
          <p className="site-footer-name">EngiMart</p>
          <p>{t("footer.tagline")}</p>
        </div>

        <div>
          <p className="site-footer-heading">{t("footer.shop")}</p>
          <ul className="site-footer-links">
            <li>
              <Link href="/">{t("footer.catalog")}</Link>
            </li>
            <li>
              <Link href="/request">{t("footer.request")}</Link>
            </li>
            <li>
              <Link href="/account">{t("footer.account")}</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="site-footer-heading">{t("footer.contact")}</p>
          <ul className="site-footer-links">
            {email ? (
              <li>
                <a href={`mailto:${email}`}>
                  <IconMail size={16} stroke={1.6} />
                  <span>
                    <span className="site-footer-label">{t("footer.email")}</span>
                    {email}
                  </span>
                </a>
              </li>
            ) : null}
            {phoneLabel && whatsappHref ? (
              <li>
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <IconBrandWhatsapp size={16} stroke={1.6} />
                  <span>
                    <span className="site-footer-label">{t("footer.whatsapp")}</span>
                    {phoneLabel}
                  </span>
                </a>
              </li>
            ) : null}
            <li>
              <span className="site-footer-static">
                <IconMapPin size={16} stroke={1.6} />
                <span>
                  <span className="site-footer-label">{t("footer.area")}</span>
                  {t("footer.areaValue")}
                </span>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="site-footer-heading">{t("footer.how")}</p>
          <ul className="site-footer-notes">
            <li>{t("footer.how1")}</li>
            <li>{t("footer.how2")}</li>
            <li>{t("footer.how3")}</li>
          </ul>
        </div>
      </div>
      <div className="wrap site-footer-bar">
        <p>{t("footer.rights")}</p>
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noreferrer">
            {t("footer.chat")}
          </a>
        ) : null}
      </div>
    </footer>
  );
}
