import { IconExternalLink } from "@tabler/icons-react";
import { LocalDateTime } from "@/components/local-datetime";
import { OrderActions } from "@/components/order-actions";
import { RemoveOrderButton } from "@/components/admin-remove-order";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createT, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatEgp } from "@/lib/money";
import { formatOrderNumber } from "@/lib/order-number";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, Profile } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await isAdminAuthenticated())) return null;
  const locale = await getLocale();
  const t = createT(getDictionary(locale));
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order || (order as Order).hidden_from_admin) notFound();

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("profiles").select("*").eq("id", order.user_id).maybeSingle(),
  ]);

  const productIds = ((items as OrderItem[] | null) ?? [])
    .map((item) => item.product_id)
    .filter(Boolean) as string[];

  const sourceUrls: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: prodData } = await supabase
      .from("products")
      .select("id, source_url")
      .in("id", productIds);
    for (const p of prodData ?? []) {
      if (p.source_url) {
        sourceUrls[p.id] = p.source_url;
      }
    }
  }

  let proofUrl: string | null = null;
  if (order.transfer_proof_url) {
    if (String(order.transfer_proof_url).startsWith("http")) {
      proofUrl = order.transfer_proof_url;
    } else {
      const { data } = await supabase.storage
        .from("transfer-proofs")
        .createSignedUrl(order.transfer_proof_url, 60 * 60);
      proofUrl = data?.signedUrl ?? null;
    }
  }

  const student = profile as Profile | null;

  return (
    <div>
      <p className="text-sm text-ink-soft">
        {t(`status.${order.status}`)}
        {" · "}
        <LocalDateTime iso={order.created_at} locale={locale} />
      </p>
      <h1 className="admin-title mt-2">
        {t("admin.order")} {formatOrderNumber((order as Order).order_number)}
      </h1>
      <dl className="surface mt-6 grid gap-4 p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-soft">{t("admin.student")}</dt>
          <dd>{student?.full_name || "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">{t("admin.phone")}</dt>
          <dd className="tabular">{student?.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">{t("admin.placed")}</dt>
          <dd>
            <LocalDateTime iso={order.created_at} locale={locale} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">{t("admin.deposit")}</dt>
          <dd className="tabular">{formatEgp((order as Order).deposit_amount)}</dd>
        </div>
        {(order as Order).status === "declined" && (order as Order).decline_reason ? (
          <div className="sm:col-span-2">
            <dt className="text-ink-soft">{t("admin.declineReason")}</dt>
            <dd>{(order as Order).decline_reason}</dd>
          </div>
        ) : null}
      </dl>
      <ul className="surface mt-6 divide-y divide-line overflow-hidden text-sm">
        {(items as OrderItem[] | null)?.map((item) => {
          const sourceUrl = item.product_id ? sourceUrls[item.product_id] : null;
          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {item.product_name} <span className="text-ink-soft">× {item.quantity}</span>
                </p>
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-accent underline hover:opacity-80"
                  >
                    <IconExternalLink size={13} stroke={1.6} />
                    {t("admin.buyFromSource")}
                  </a>
                ) : null}
              </div>
              <span className="tabular font-medium">
                {formatEgp(Number(item.unit_base_price_at_order_time) * item.quantity)}
              </span>
            </li>
          );
        })}
        <li className="flex justify-between gap-4 px-6 py-4 font-medium">
          <span>{t("admin.total")}</span>
          <span className="tabular">{formatEgp(order.total_price)}</span>
        </li>
      </ul>
      <p className="mt-4 text-sm text-ink-soft">
        {t("admin.itemsPlusFee", {
          items: formatEgp(order.items_subtotal),
          fee: formatEgp(order.service_fee),
        })}
      </p>
      <div className="surface mt-6 p-6">
        <p className="text-sm text-ink-soft">{t("admin.proof")}</p>
        {proofUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proofUrl} alt={t("admin.proof")} className="mt-4 max-h-96 rounded border border-line" />
        ) : (
          <p className="mt-2 text-sm">{t("admin.noProof")}</p>
        )}
      </div>
      <OrderActions orderId={id} status={(order as Order).status} />
      <div className="mt-4">
        <RemoveOrderButton orderId={id} redirectTo="/admin" />
      </div>
    </div>
  );
}
