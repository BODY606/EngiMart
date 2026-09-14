import { requireAdmin } from "@/lib/admin-api";
import { jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { productSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if ("response" in admin) return admin.response;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const parsed = productSchema.safeParse({
      name: form.get("name"),
      description: form.get("description") ?? "",
      basePrice: form.get("basePrice"),
      salePrice: form.get("salePrice") || null,
      imageUrl: form.get("imageUrl") || null,
      sourceUrl: form.get("sourceUrl") || null,
      isAvailable: form.get("isAvailable") === "true",
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid product");
    }

    const supabase = createAdminClient();
    let imageUrl = parsed.data.imageUrl || null;
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, Buffer.from(await file.arrayBuffer()), {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
      if (uploadError) return jsonError(uploadError.message, 500);
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const insertPayload: Record<string, unknown> = {
      name: parsed.data.name,
      description: parsed.data.description,
      base_price: parsed.data.basePrice,
      sale_price: parsed.data.salePrice || null,
      image_url: imageUrl,
      source_url: parsed.data.sourceUrl || null,
      is_available: parsed.data.isAvailable ?? true,
    };

    let { data, error } = await supabase
      .from("products")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error && (error.code === "42703" || error.message.includes("sale_price") || error.message.includes("source_url"))) {
      return jsonError(
        "لم يتم حفظ سعر العرض أو رابط المصدر لأن الأعمدة غير مضافة في Supabase بعد. يرجى تشغيل: ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric(12, 2); في SQL Editor.",
        400,
      );
    }

    if (error || !data) return jsonError(error?.message ?? "Could not add product", 500);
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/");
    } catch {}
    return NextResponse.json({ id: data.id });
  }

  return jsonError("Expected a form submission");
}
