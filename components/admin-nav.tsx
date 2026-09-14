"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLock,
  IconMessage,
  IconPackage,
  IconShoppingCart,
  IconTag,
} from "@tabler/icons-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/lib/i18n/provider";

const links = [
  { href: "/admin", key: "admin.orders", icon: IconShoppingCart },
  { href: "/admin/requests", key: "admin.requests", icon: IconMessage },
  { href: "/admin/products", key: "admin.products", icon: IconPackage },
  { href: "/admin/pricing", key: "admin.pricing", icon: IconTag },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="admin-rail">
      <div className="admin-rail-head">
        <p className="text-sm font-medium">{t("admin.ops")}</p>
        <div className="flex items-center gap-4 md:hidden">
          <LanguageSwitcher />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void fetch("/api/admin/logout", { method: "POST" }).then(() => {
                window.location.reload();
              });
            }}
          >
            <button className="btn btn-secondary" type="submit" aria-label={t("admin.lock")}>
              <IconLock size={16} stroke={1.6} />
              {t("admin.lock")}
            </button>
          </form>
        </div>
      </div>

      <nav className="admin-nav">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin" || pathname.startsWith("/admin/orders")
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-nav-link ${active ? "is-active" : ""}`}
            >
              <Icon size={18} stroke={1.6} aria-hidden />
              {t(link.key)}
            </Link>
          );
        })}
      </nav>

      <form
        className="admin-lock-wrap hidden md:block"
        onSubmit={(event) => {
          event.preventDefault();
          void fetch("/api/admin/logout", { method: "POST" }).then(() => {
            window.location.reload();
          });
        }}
      >
        <div className="mb-4">
          <LanguageSwitcher />
        </div>
        <button className="btn btn-secondary w-full" type="submit">
          <IconLock size={16} stroke={1.6} />
          {t("admin.lock")}
        </button>
      </form>
    </aside>
  );
}
