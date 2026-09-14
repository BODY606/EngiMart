"use client";

import { AdminEmpty } from "@/components/admin-empty";
import { AdminSearch } from "@/components/admin-search";
import { RemoveRequestButton } from "@/components/admin-remove-request";
import { LocalDateTime } from "@/components/local-datetime";
import { matchesRequest } from "@/lib/admin-search";
import { formatEgp } from "@/lib/money";
import { useT } from "@/lib/i18n/provider";
import type { CustomOrderRequest } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

export function AdminRequestsList({
  requests,
  names,
  locale,
}: {
  requests: CustomOrderRequest[];
  names: Record<string, string>;
  locale: string;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      requests.filter((request) =>
        matchesRequest(
          request,
          names[request.user_id] || "",
          query,
          locale,
        ),
      ),
    [locale, names, query, requests],
  );

  return (
    <>
      <AdminSearch
        value={query}
        onChange={setQuery}
        placeholder={t("admin.searchRequests")}
        label={t("admin.searchRequests")}
      />
      <div className="mt-6">
        {requests.length === 0 ? (
          <AdminEmpty
            icon="requests"
            title={t("admin.emptyRequests")}
            copy={t("admin.emptyRequestsCopy")}
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            icon="requests"
            title={t("admin.noSearchResults")}
            copy={t("admin.noSearchResultsCopy")}
          />
        ) : (
          <div className="surface overflow-hidden">
            <div className="admin-order-row admin-order-row-head-wrap">
              <div className="admin-row admin-row-head text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <span>{t("admin.request")}</span>
                <span>{t("admin.status")}</span>
                <span className="text-end">{t("admin.total")}</span>
              </div>
              <div className="admin-order-row-action" aria-hidden />
            </div>
            {filtered.map((request) => (
              <div key={request.id} className="admin-order-row">
                <Link
                  href={`/admin/requests/${request.id}`}
                  className="admin-row"
                >
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm">
                      {request.description}
                    </span>
                    <span className="mt-1 block text-xs text-ink-soft">
                      {names[request.user_id] ? `${names[request.user_id]} · ` : ""}
                      <LocalDateTime iso={request.created_at} locale={locale} />
                    </span>
                  </span>
                  <span>
                    <span className="admin-status">
                      {t(`status.${request.status}`)}
                    </span>
                  </span>
                  <span className="tabular text-end font-medium">
                    {request.total_price ? formatEgp(request.total_price) : "—"}
                  </span>
                </Link>
                <div className="admin-order-row-action">
                  <RemoveRequestButton requestId={request.id} variant="icon" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
