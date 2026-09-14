"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconShoppingCart, IconUser } from "@tabler/icons-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useCart } from "@/components/cart-provider";
import { useSearchQuery } from "@/components/search-query";
import { useT } from "@/lib/i18n/provider";

export function SiteHeader({
  userName,
  configured,
}: {
  userName: string | null;
  configured: boolean;
}) {
  const pathname = usePathname();
  const { count, bump } = useCart();
  const { query, setQuery, submit } = useSearchQuery();
  const t = useT();
  const loggedIn = Boolean(userName);

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    submit();
  }

  return (
    <header className="site-header">
      <div className="wrap site-header-row">
        <Link href="/" className="site-logo">
          <span className="site-logo-mark">EM</span>
          <span className="site-logo-word">EngiMart</span>
        </Link>

        {configured ? (
          <form onSubmit={onSearch} className="site-search">
            <input
              className="site-search-input"
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                if (pathname === "/") {
                  const url = next.trim()
                    ? `/?q=${encodeURIComponent(next.trim())}`
                    : "/";
                  window.history.replaceState(null, "", url);
                }
              }}
              placeholder={t("nav.search")}
              aria-label={t("nav.searchAria")}
            />
          </form>
        ) : (
          <div className="site-search-spacer" />
        )}

        <nav className="site-header-actions">
          <Link href="/request" className="site-nav-link">
            {t("nav.request")}
          </Link>

          <LanguageSwitcher />

          <Link
            href={loggedIn ? "/account" : "/login?next=/account"}
            className="site-icon-btn site-icon-btn-lg"
            aria-label={loggedIn ? t("nav.account") : t("nav.signIn")}
          >
            <IconUser size={18} stroke={1.6} />
          </Link>

          <Link
            href="/cart"
            className={`site-icon-btn site-icon-btn-lg ${bump ? "cart-pop" : ""}`}
            aria-label={t("nav.cart", { n: count })}
          >
            <IconShoppingCart size={18} stroke={1.6} />
            {count > 0 && <span className="site-cart-count">{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
