"use client";

import { PendingLabel } from "@/components/pending-label";
import { formatEgp } from "@/lib/money";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef } from "react";
import type { Product } from "@/lib/types";
import {
  IconFileTypePdf,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconEye,
  IconFileText,
} from "@tabler/icons-react";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Prices
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

  // Multiple Images State
  const initialImages = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    if (product?.image_url) {
      return [product.image_url];
    }
    return [];
  }, [product]);

  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string }[]>([]);

  // PDF State
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(
    product?.pdf_url || null,
  );
  const [removePdf, setRemovePdf] = useState(false);
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);

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

  function handleSelectImages(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImageFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeExistingImage(indexToRemove: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  }

  function removeNewImage(indexToRemove: number) {
    setNewImageFiles((prev) => {
      const target = prev[indexToRemove];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== indexToRemove);
    });
  }

  function handleSelectPdf(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setNewPdfFile(e.target.files[0]);
      setRemovePdf(false);
    }
  }

  function handleClearNewPdf() {
    setNewPdfFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = event.currentTarget;
    const body = new FormData(form);

    const available = form.querySelector<HTMLInputElement>("#available");
    body.set("isAvailable", available?.checked ? "true" : "false");

    // Images payload
    body.set("hasImageEdits", "true");
    body.delete("existingImages");
    existingImages.forEach((img) => body.append("existingImages", img));

    // Append newly chosen image files
    body.delete("images");
    body.delete("image");
    newImageFiles.forEach((item) => body.append("images", item.file));

    // PDF payload
    if (removePdf) {
      body.set("removePdf", "true");
    } else if (newPdfFile) {
      body.set("pdf", newPdfFile);
    }

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

  const totalImageCount = existingImages.length + newImageFiles.length;

  return (
    <form className="mt-6 stack" onSubmit={(event) => void onSubmit(event)}>
      <div>
        <label htmlFor="name">{t("admin.name")}</label>
        <input
          id="name"
          name="name"
          required
          defaultValue={product?.name}
          className="w-full text-base"
        />
      </div>

      <div>
        <label htmlFor="description">{t("admin.description")}</label>
        <textarea
          id="description"
          name="description"
          rows={4}
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

      {/* Multiple Images Management */}
      <div className="rounded-lg border border-line p-4 surface">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="font-semibold text-ink flex items-center gap-1.5">
              <IconPhoto size={18} />
              {t("admin.images")}
            </label>
            <p className="text-xs text-ink-soft mt-0.5">{t("admin.imagesHint")}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary text-sm inline-flex items-center gap-1.5 py-1 px-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <IconPlus size={16} />
            <span>{t("admin.addMoreImages")}</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleSelectImages}
        />

        {totalImageCount > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {/* Existing Images */}
            {existingImages.map((src, idx) => (
              <div
                key={`existing-${idx}`}
                className="group relative aspect-square overflow-hidden rounded-md border border-line bg-paper shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {idx === 0 && (
                  <span className="absolute start-1.5 top-1.5 z-10 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-paper shadow-xs">
                    {t("admin.primaryBadge")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeExistingImage(idx)}
                  className="absolute end-1.5 top-1.5 rounded-full bg-paper/90 p-1.5 text-danger shadow-xs hover:bg-paper"
                  title={t("admin.removeImage")}
                >
                  <IconTrash size={14} />
                </button>
              </div>
            ))}

            {/* Newly Selected Image Files */}
            {newImageFiles.map((item, idx) => {
              const overallIdx = existingImages.length + idx;
              return (
                <div
                  key={`new-${idx}`}
                  className="group relative aspect-square overflow-hidden rounded-md border-2 border-dashed border-accent/40 bg-accent/5 shadow-xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {overallIdx === 0 && (
                    <span className="absolute start-1.5 top-1.5 z-10 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-paper shadow-xs">
                      {t("admin.primaryBadge")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute end-1.5 top-1.5 rounded-full bg-paper/90 p-1.5 text-danger shadow-xs hover:bg-paper"
                    title={t("admin.removeImage")}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line p-6 text-center transition-colors hover:border-accent hover:bg-paper"
          >
            <IconPhoto size={36} className="text-ink-soft mb-2 stroke-1" />
            <p className="text-sm font-medium text-ink">{t("admin.addMoreImages")}</p>
            <p className="mt-1 text-xs text-ink-soft">{t("admin.imagesHint")}</p>
          </div>
        )}
      </div>

      {/* PDF Specifications / Datasheet Management */}
      <div className="rounded-lg border border-line p-4 surface">
        <div>
          <label className="font-semibold text-ink flex items-center gap-1.5">
            <IconFileTypePdf size={18} className="text-red-500" />
            {t("admin.pdfFile")}
          </label>
          <p className="text-xs text-ink-soft mt-0.5">{t("admin.pdfFileHint")}</p>
        </div>

        {/* Existing PDF attached */}
        {existingPdfUrl && !removePdf && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-paper px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-red-500/10 p-2 text-red-600 dark:text-red-400">
                <IconFileTypePdf size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{t("admin.currentPdf")}</p>
                <p className="text-xs text-ink-soft">PDF Datasheet</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={existingPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
              >
                <IconEye size={14} />
                <span>{t("admin.viewPdf")}</span>
              </a>
              <button
                type="button"
                onClick={() => setRemovePdf(true)}
                className="btn btn-secondary text-danger text-xs py-1 px-2.5 inline-flex items-center gap-1 hover:bg-danger/10"
              >
                <IconTrash size={14} />
                <span>{t("admin.removePdf")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload new or replace PDF */}
        <div className="mt-3">
          {newPdfFile ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-paper px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="rounded bg-accent/10 p-2 text-accent">
                  <IconFileText size={20} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{newPdfFile.name}</p>
                  <p className="text-xs text-ink-soft">
                    {(newPdfFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearNewPdf}
                className="btn btn-secondary text-danger text-xs py-1 px-2.5 inline-flex items-center gap-1"
              >
                <IconTrash size={14} />
                <span>{t("admin.cancel")}</span>
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="block w-full text-sm text-ink-soft file:me-4 file:rounded file:border-0 file:bg-paper file:px-4 file:py-2 file:text-xs file:font-semibold file:text-ink hover:file:bg-line/40 cursor-pointer"
                onChange={handleSelectPdf}
              />
            </div>
          )}
        </div>
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
