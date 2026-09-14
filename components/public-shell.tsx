"use client";

import { CartProvider } from "@/components/cart-provider";
import { SearchQueryProvider } from "@/components/search-query";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { usePathname } from "next/navigation";

export function PublicShell({
  children,
  userName,
  configured,
}: {
  children: React.ReactNode;
  userName: string | null;
  configured: boolean;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <SearchQueryProvider>
        <div className="flex min-h-full flex-col">
          <SiteHeader userName={userName} configured={configured} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </SearchQueryProvider>
    </CartProvider>
  );
}
