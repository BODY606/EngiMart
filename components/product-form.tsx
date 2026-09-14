"use client";

import { PendingLabel } from "@/components/pending-label";
import { formatEgp } from "@/lib/money";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [basePrice, setBasePrice] = useState<string>(
    product ? String(product.base_price) : "",
  );
  const [salePrice, setSalePrice] = useState<string>(
    product?.sale_price !== null && product?.sale_price !== undefined
      ? String(product.sale_price)
      : "",
  );
  const [discountPercent, setDiscountPercent] = useState<string>(() => {
    if (
      product?.base_price &&
      product?.sale_price &&
      Number(product.sale_price) < Number(product.base_price)
    ) {
      return String(
        Math.round(
          ((Number(product.base_price) - Number(product.sale_price)) /
            Number(product.base_price)) *
            100,
        ),
      );
    }
    return "";
  });

  function handleBasePriceChange(val: string) {
    setBasePrice(val);
    const base = parseFloat(val);
    const pct = parseFloat(discountPercent);
    if (!isNaN(base) && base > 0 && !isNaN(pct) && pct > 0 && pct < 100) {
      const calculated = (base * (1 - pct / 100)).toFixed(2);
      setSalePrice(calculated);
    } else {
      const sale = parseFloat(salePrice);
      if (!isNaN(base) && base > 0 && !isNaN(sale) && sale > 0 && sale < base) {
        setDiscountPercent(String(Math.round(((base - sale) / base) * 100)));
      }
    }
  }

  function handleDiscountPercentChange(val: string) {
    setDiscountPercent(val);
    const pct = parseFloat(val);
    const base = parseFloat(basePrice);
    if (!val || isNaN(pct) || pct <= 0) {
      setSalePrice("");
      return;
    }
    if (!isNaN(base) && base > 0 && pct < 100) {
      const calculated = (base * (1 - pct / 100)).toFixed(2);
      setSalePrice(calculated);
    }
  }

  function handleSalePriceChange(val: string) {
    setSalePrice(val);
    const sale = parseFloat(val);
    const base = parseFloat(basePrice);
    if (!val || isNaN(sale) || sale <= 0) {
      setDiscountPercent("");
      return;
    }
    if (!isNaN(base) && base > 0) {
      if (sale < base) {
        const pct = Math.round(((base - sale) / base) * 100);
        setDiscountPercent(String(pct));
      } else {
        setDiscountPercent("");
      }
    }
  }

  const discountInfo = useMemo(() => {
    const base = parseFloat(basePrice);
    const sale = parseFloat(salePrice);
    if (!basePrice || !salePrice || isNaN(base) || isNaN(sale) || sale <= 0) {
      return null;
    }
    if (sale >= base) {
      return { invalid: true, percent: 0, savings: 0 };
    }
    const percent = Math.round(((base - sale) / base) * 100);
    const savings = base - sale;
    return { invalid: false, percent, savings };
  }, [basePrice, salePrice]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const body = new FormData(form);
    const available = form.querySelector<HTMLInputElement>("#available");
    body.set("isAvailable", available?.checked ? "true" : "false");
    const endpoint = product
      ? `/api/admin/products/${product.id}`
      : "/api/admin/products";
    const response = await fetch(endpoint, {
      method: product ? "PATCH" : "POST",
      body,
    });
    const payload = (await response.json()) as { error?: string; id?: string };
    if (!response.ok) {
      setError(payload.error || t("auth.fail"));
      setPending(false);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form className="mt-6 stack" onSubmit={(event) => void onSubmit(event)}>
      <div>
        <label htmlFor="name">{t("admin.name")}</label>
        <input id="name" name="name" required defaultValue={product?.name} />
      </div>
      <div>
        <label htmlFor="description">{t("admin.description")}</label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="basePrice">{t("admin.basePrice")}</label>
          <input
            id="basePrice"
            name="basePrice"
            type="number"
            min="0"
            step="0.01"
            required
            value={basePrice}
            onChange={(e) => handleBasePriceChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="discountPercent">{t("admin.discountPercent")}</label>
          <input
            id="discountPercent"
            type="number"
            min="1"
            max="99"
            step="1"
            placeholder={t("admin.discountPercentPlaceholder")}
            value={discountPercent}
            onChange={(e) => handleDiscountPercentChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="salePrice">{t("admin.salePrice")}</label>
          <input
            id="salePrice"
            name="salePrice"
            type="number"
            min="0"
            step="0.01"
            placeholder={t("admin.salePricePlaceholder")}
            value={salePrice}
            onChange={(e) => handleSalePriceChange(e.target.value)}
          />
        </div>
      </div>
      {discountInfo && (
        <div className="rounded border border-line bg-paper px-3 py-2 text-sm">
          {discountInfo.invalid ? (
            <p className="text-danger font-medium">{t("admin.salePriceWarning")}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-paper">
                {t("admin.discountBadge", { percent: discountInfo.percent })}
              </span>
              <span className="text-ink-soft">
                {t("admin.discountSavings", {
                  amount: formatEgp(discountInfo.savings),
                })}
              </span>
            </div>
          )}
        </div>
      )}
      <div>
        <label htmlFor="image">{t("admin.image")}</label>
        {product?.image_url ? (
          <div className="thumb mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <input id="image" name="image" type="file" accept="image/*" />
      </div>
      <div>
        <label htmlFor="sourceUrl">{t("admin.sourceUrl")}</label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          placeholder="https://..."
          defaultValue={product?.source_url ?? ""}
        />
        <p className="mt-1 text-xs text-ink-soft">{t("admin.sourceUrlHint")}</p>
      </div>
      <label className="flex items-center gap-2 normal-case tracking-normal">
        <input
          id="available"
          type="checkbox"
          defaultChecked={product?.is_available ?? true}
          className="w-auto"
        />
        {t("admin.available")}
      </label>
      {error && <p className="field-error">{error}</p>}
      <button className="btn btn-primary" disabled={pending}>
        <PendingLabel
          pending={pending}
          idle={product ? t("admin.save") : t("admin.add")}
          busy={t("admin.saving")}
        />
      </button>
    </form>
  );
}
