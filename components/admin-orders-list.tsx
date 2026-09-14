"use client";

import { AdminEmpty } from "@/components/admin-empty";
import { AdminSearch } from "@/components/admin-search";
import { RemoveOrderButton } from "@/components/admin-remove-order";
import { LocalDateTime } from "@/components/local-datetime";
import { matchesOrder } from "@/lib/admin-search";
import { formatEgp } from "@/lib/money";
import { formatOrderNumber } from "@/lib/order-number";
import { useT } from "@/lib/i18n/provider";
import type { Order } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

const TABS = [
  "all",
  "pending",
  "deposit_paid",
  "approved",
  "declined",
  "completed",
] as const;

type Tab = (typeof TABS)[number];

function isTab(value: string): value is Tab {
  return TABS.includes(value as Tab);
}

export function AdminOrdersList({
  orders,
  names,
  status,
  locale,
}: {
  orders: Order[];
  names: Record<string, string>;
  status: string;
  locale: string;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>(isTab(status) ? status : "all");

  function selectTab(next: Tab) {
    setTab(next);
    const url = next === "all" ? "/admin" : `/admin?status=${next}`;
    window.history.replaceState(null, "", url);
  }

  const inTab = useMemo(
    () => (tab === "all" ? orders : orders.filter((order) => order.status === tab)),
    [orders, tab],
  );
  const filtered = useMemo(
    () =>
      inTab.filter((order) =>
        matchesOrder(
          order,
          names[order.user_id] || t("admin.student"),
          query,
          locale,
        ),
      ),
    [inTab, locale, names, query, t],
  );

  return (
    <>
      <AdminSearch
        value={query}
        onChange={setQuery}
        placeholder={t("admin.searchOrders")}
        label={t("admin.searchOrders")}
      />
      <div className="admin-tabs mt-6">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            className={`admin-tab ${tab === id ? "is-active" : ""}`}
            onClick={() => selectTab(id)}
          >
            {t(`status.${id}`)}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {inTab.length === 0 ? (
          <AdminEmpty
            icon="orders"
            title={t("admin.emptyOrders")}
            copy={
              tab === "all"
                ? t("admin.emptyOrdersAll")
                : t("admin.emptyOrdersTab", { status: t(`status.${tab}`) })
            }
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            icon="orders"
            title={t("admin.noSearchResults")}
            copy={t("admin.noSearchResultsCopy")}
          />
        ) : (
          <div className="surface overflow-hidden">
            <div className="admin-order-row admin-order-row-head-wrap">
              <div className="admin-row admin-row-head text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <span>{t("admin.student")}</span>
                <span>{t("admin.status")}</span>
                <span className="text-end">{t("admin.total")}</span>
              </div>
              <div className="admin-order-row-action" aria-hidden />
            </div>
            {filtered.map((order) => (
              <div key={order.id} className="admin-order-row">
                <Link href={`/admin/orders/${order.id}`} className="admin-row">
                  <span className="min-w-0">
                    {formatOrderNumber(order.order_number) ? (
                      <span className="block truncate font-medium tabular">
                        {formatOrderNumber(order.order_number)}
                      </span>
                    ) : null}
                    <span className={`block truncate text-sm ${formatOrderNumber(order.order_number) ? "mt-1" : "font-medium"}`}>
                      {names[order.user_id] || t("admin.student")}
                    </span>
                    <span className="mt-1 block text-xs text-ink-soft">
                      <LocalDateTime iso={order.created_at} locale={locale} />
                    </span>
                  </span>
                  <span>
                    <span className="admin-status">{t(`status.${order.status}`)}</span>
                  </span>
                  <span className="tabular text-end font-medium">
                    {formatEgp(order.total_price)}
                  </span>
                </Link>
                <div className="admin-order-row-action">
                  <RemoveOrderButton orderId={order.id} variant="icon" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
