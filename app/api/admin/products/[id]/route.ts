import { requireAdmin } from "@/lib/admin-api";
import { jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { productSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = productSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if ("response" in admin) return admin.response;
  const { id } = await params;
  const supabase = createAdminClient();

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const parsed = patchSchema.safeParse({
      name: form.get("name") ?? undefined,
      description: form.get("description") ?? undefined,
      basePrice: form.get("basePrice") ?? undefined,
      salePrice: form.has("salePrice")
        ? form.get("salePrice")
          ? form.get("salePrice")
          : null
        : undefined,
      sourceUrl: form.has("sourceUrl") ? form.get("sourceUrl") || null : undefined,
      isAvailable: form.has("isAvailable")
        ? form.get("isAvailable") === "true"
        : undefined,
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid product");
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) {
      updates.description = parsed.data.description;
    }
    if (parsed.data.basePrice !== undefined) updates.base_price = parsed.data.basePrice;
    if (parsed.data.salePrice !== undefined) updates.sale_price = parsed.data.salePrice;
    if (parsed.data.sourceUrl !== undefined) updates.source_url = parsed.data.sourceUrl || null;
    if (parsed.data.isAvailable !== undefined) {
      updates.is_available = parsed.data.isAvailable;
    }

    // 1. Handle Images
    const hasImageSection =
      form.has("hasImageEdits") ||
      form.has("existingImages") ||
      form.has("images") ||
      form.has("image");

    if (hasImageSection) {
      const remainingExisting = form
        .getAll("existingImages")
        .map((item) => String(item).trim())
        .filter(Boolean);

      const newUploadedImages: string[] = [];
      const imageFiles: File[] = [];
      const filesFromImages = form.getAll("images");
      for (const f of filesFromImages) {
        if (f instanceof File && f.size > 0) imageFiles.push(f);
      }
      const singleImage = form.get("image");
      if (
        singleImage instanceof File &&
        singleImage.size > 0 &&
        !imageFiles.includes(singleImage)
      ) {
        imageFiles.push(singleImage);
      }

      for (const file of imageFiles) {
        const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, Buffer.from(await file.arrayBuffer()), {
            contentType: file.type || "image/jpeg",
            upsert: false,
          });
        if (uploadError) return jsonError(`فشل رفع الصورة: ${uploadError.message}`, 500);
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        newUploadedImages.push(data.publicUrl);
      }

      const finalImages = [...remainingExisting, ...newUploadedImages];
      updates.images = finalImages;
      updates.image_url = finalImages[0] || null;
    }

    // 2. Handle PDF
    if (form.get("removePdf") === "true") {
      updates.pdf_url = null;
    } else {
      const pdfFile = form.get("pdf");
      if (pdfFile instanceof File && pdfFile.size > 0) {
        const path = `${crypto.randomUUID()}.pdf`;
        let { error: pdfError } = await supabase.storage
          .from("product-files")
          .upload(path, Buffer.from(await pdfFile.arrayBuffer()), {
            contentType: "application/pdf",
            upsert: false,
          });

        if (pdfError && pdfError.message.includes("not found")) {
          await supabase.storage.createBucket("product-files", { public: true });
          const retry = await supabase.storage
            .from("product-files")
            .upload(path, Buffer.from(await pdfFile.arrayBuffer()), {
              contentType: "application/pdf",
              upsert: false,
            });
          pdfError = retry.error;
        }

        if (pdfError) return jsonError(`فشل رفع ملف الـ PDF: ${pdfError.message}`, 500);
        updates.pdf_url = supabase.storage.from("product-files").getPublicUrl(path).data.publicUrl;
      }
    }

    let { error } = await supabase.from("products").update(updates).eq("id", id);

    // Fallback if newly added columns don't exist yet in Supabase
    if (error && error.code === "42703") {
      const fallbackUpdates = { ...updates };
      delete fallbackUpdates.images;
      delete fallbackUpdates.pdf_url;
      if (error.message.includes("sale_price")) delete fallbackUpdates.sale_price;
      if (error.message.includes("source_url")) delete fallbackUpdates.source_url;

      const fallback = await supabase.from("products").update(fallbackUpdates).eq("id", id);
      if (!fallback.error) {
        error = null;
      }
    }

    if (error) return jsonError(error.message, 500);
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/");
      revalidatePath("/admin/products");
      revalidatePath(`/products/${id}`);
    } catch {}
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid product");
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.basePrice !== undefined) updates.base_price = parsed.data.basePrice;
  if (parsed.data.salePrice !== undefined) updates.sale_price = parsed.data.salePrice;
  if (parsed.data.sourceUrl !== undefined) updates.source_url = parsed.data.sourceUrl || null;
  if (parsed.data.isAvailable !== undefined) updates.is_available = parsed.data.isAvailable;
  if (parsed.data.imageUrl !== undefined) updates.image_url = parsed.data.imageUrl || null;
  if (parsed.data.images !== undefined) {
    updates.images = parsed.data.images;
    if (parsed.data.images.length > 0 && !parsed.data.imageUrl) {
      updates.image_url = parsed.data.images[0];
    }
  }
  if (parsed.data.pdfUrl !== undefined) updates.pdf_url = parsed.data.pdfUrl || null;

  let { error } = await supabase.from("products").update(updates).eq("id", id);

  if (error && error.code === "42703") {
    const fallbackUpdates = { ...updates };
    delete fallbackUpdates.images;
    delete fallbackUpdates.pdf_url;
    if (error.message.includes("sale_price")) delete fallbackUpdates.sale_price;
    if (error.message.includes("source_url")) delete fallbackUpdates.source_url;

    const fallback = await supabase.from("products").update(fallbackUpdates).eq("id", id);
    if (!fallback.error) {
      error = null;
    }
  }

  if (error) return jsonError(error.message, 500);
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/admin/products");
    revalidatePath(`/products/${id}`);
  } catch {}
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if ("response" in admin) return admin.response;
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);

  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/admin/products");
    revalidatePath(`/products/${id}`);
  } catch {}

  return NextResponse.json({ ok: true });
}
