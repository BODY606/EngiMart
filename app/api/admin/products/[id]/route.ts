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

    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, Buffer.from(await file.arrayBuffer()), {
          contentType: file.type || "image/jpeg",
        });
      if (uploadError) return jsonError(uploadError.message, 500);
      updates.image_url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }

    let { error } = await supabase.from("products").update(updates).eq("id", id);
    if (error && (error.code === "42703" || error.message.includes("sale_price") || error.message.includes("source_url"))) {
      return jsonError(
        "لم يتم حفظ سعر العرض أو رابط المصدر لأن الأعمدة غير مضافة في Supabase بعد. يرجى تشغيل: ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric(12, 2); في SQL Editor.",
        400,
      );
    }
    if (error) return jsonError(error.message, 500);
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/");
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

  let { error } = await supabase.from("products").update(updates).eq("id", id);
  if (error && (error.code === "42703" || error.message.includes("sale_price") || error.message.includes("source_url"))) {
    return jsonError(
      "لم يتم حفظ سعر العرض أو رابط المصدر لأن الأعمدة غير مضافة في Supabase بعد. يرجى تشغيل: ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric(12, 2); في SQL Editor.",
      400,
    );
  }
  if (error) return jsonError(error.message, 500);
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/admin/products");
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
  } catch {}

  return NextResponse.json({ ok: true });
}

