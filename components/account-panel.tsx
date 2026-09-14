"use client";

import { LocalDateTime } from "@/components/local-datetime";
import { RemoveOwnRequestButton } from "@/components/remove-own-request";
import { formatEgp } from "@/lib/money";
import { formatOrderNumber } from "@/lib/order-number";
import { useT } from "@/lib/i18n/provider";
import type { CustomOrderRequest, Order, OrderItem } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

type Tab = "ongoing" | "requests" | "approved" | "declined";

const TABS: Tab[] = ["ongoing", "requests", "approved", "declined"];

type OrderWithItems = Order & {
  order_items: Pick<OrderItem, "product_name" | "quantity">[];
};

function isTab(value: string | undefined): value is Tab {
  return TABS.includes(value as Tab);
}

function orderItemLabel(order: OrderWithItems) {
  const items = order.order_items ?? [];
  if (items.length === 0) return "—";
  const first = items[0].product_name;
  if (items.length === 1) return first;
  return `${first} +${items.length - 1}`;
}

export function AccountPanel({
  orders,
  requests,
  initialTab,
  locale,
}: {
  orders: OrderWithItems[];
  requests: CustomOrderRequest[];
  initialTab: string;
  locale: "en" | "ar";
}) {
  const t = useT();
  const [tab, setTab] = useState<Tab>(isTab(initialTab) ? initialTab : "ongoing");

  const ongoing = orders.filter(
    (order) => order.status === "pending" || order.status === "deposit_paid",
  );
  const approved = orders.filter(
    (order) => order.status === "approved" || order.status === "completed",
  );
  const declined = orders.filter((order) => order.status === "declined");

  const labels: Record<Tab, string> = {
    ongoing: t("account.ongoing"),
    requests: t("account.requests"),
    approved: t("account.approved"),
    declined: t("account.declined"),
  };

  function selectTab(next: Tab) {
    setTab(next);
    const url = next === "ongoing" ? "/account" : `/account?tab=${next}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <nav className="account-tabs mt-8" aria-label={t("account.title")}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            className={`account-tab ${tab === id ? "is-active" : ""}`}
            onClick={() => selectTab(id)}
          >
            {labels[id]}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "requests" ? (
          <div className="surface list-panel">
            {requests.length ? (
              requests.map((request) => (
                <div key={request.id} className="account-request-row">
                  <Link href={`/requests/${request.id}`} className="list-row">
                    <span className="min-w-0">
                      <span className="block truncate">{request.description}</span>
                      <span className="mt-1 block text-sm text-ink-soft">
                        <LocalDateTime iso={request.created_at} locale={locale} />
                      </span>
                      {request.status === "declined" && request.decline_reason ? (
                        <span className="mt-1 block text-sm text-ink-soft">
                          {t("order.declineReason", { reason: request.decline_reason })}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 flex-col gap-1 text-end">
                      <span className="text-sm text-ink-soft">
                        {t(`status.${request.status}`)}
                      </span>
                      <span className="tabular font-medium">
                        {request.total_price ? formatEgp(request.total_price) : "—"}
                      </span>
                    </span>
                  </Link>
                  <div className="account-request-action">
                    <RemoveOwnRequestButton requestId={request.id} />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-sm text-ink-soft">{t("account.emptyRequests")}</p>
            )}
          </div>
        ) : (
          <OrderList
            orders={tab === "ongoing" ? ongoing : tab === "approved" ? approved : declined}
            locale={locale}
            empty={t("account.emptyOrders")}
            statusOf={(status) => t(`status.${status}`)}
            reasonOf={(reason) => t("order.declineReason", { reason })}
          />
        )}
      </div>
    </>
  );
}

function OrderList({
  orders,
  locale,
  empty,
  statusOf,
  reasonOf,
}: {
  orders: OrderWithItems[];
  locale: "en" | "ar";
  empty: string;
  statusOf: (status: string) => string;
  reasonOf: (reason: string) => string;
}) {
  if (orders.length === 0) {
    return (
      <div className="surface list-panel">
        <p className="p-6 text-sm text-ink-soft">{empty}</p>
      </div>
    );
  }

  return (
    <div className="surface list-panel">
      {orders.map((order) => (
        <Link key={order.id} href={`/orders/${order.id}`} className="list-row">
          <span className="min-w-0">
            {formatOrderNumber(order.order_number) ? (
              <span className="block font-medium tabular">
                {formatOrderNumber(order.order_number)}
              </span>
            ) : null}
            <span
              className={`block truncate ${formatOrderNumber(order.order_number) ? "mt-1" : ""}`}
            >
              {orderItemLabel(order)}
            </span>
            <span className="mt-1 block text-sm text-ink-soft">
              <LocalDateTime iso={order.created_at} locale={locale} />
            </span>
            {order.status === "declined" && order.decline_reason ? (
              <span className="mt-1 block text-sm text-ink-soft">
                {reasonOf(order.decline_reason)}
              </span>
            ) : null}
          </span>
          <span className="flex shrink-0 flex-col gap-1 text-end">
            <span className="text-sm text-ink-soft">{statusOf(order.status)}</span>
            <span className="tabular font-medium">{formatEgp(order.total_price)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
