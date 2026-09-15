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

    // 1. Handle Images
    const uploadedImages: string[] = [];

    // Collect any existing image URLs that were sent
    const existingImages = form
      .getAll("existingImages")
      .map((item) => String(item).trim())
      .filter(Boolean);

    // Collect all uploaded image files
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

    // Upload image files
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
      uploadedImages.push(data.publicUrl);
    }

    const allImages = [...existingImages, ...uploadedImages];
    const primaryImageUrl = allImages[0] || parsed.data.imageUrl || null;

    // 2. Handle PDF file
    let pdfUrl: string | null = null;
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
      pdfUrl = supabase.storage.from("product-files").getPublicUrl(path).data.publicUrl;
    } else if (form.get("pdfUrl")) {
      pdfUrl = String(form.get("pdfUrl")).trim() || null;
    }

    const insertPayload: Record<string, unknown> = {
      name: parsed.data.name,
      description: parsed.data.description,
      base_price: parsed.data.basePrice,
      sale_price: parsed.data.salePrice || null,
      image_url: primaryImageUrl,
      images: allImages,
      pdf_url: pdfUrl,
      source_url: parsed.data.sourceUrl || null,
      is_available: parsed.data.isAvailable ?? true,
    };

    let { data, error } = await supabase
      .from("products")
      .insert(insertPayload)
      .select("id")
      .single();

    // Fallback if newly added columns (images, pdf_url, etc.) don't exist yet in Supabase
    if (error && error.code === "42703") {
      const fallbackPayload = { ...insertPayload };
      delete fallbackPayload.images;
      delete fallbackPayload.pdf_url;
      if (error.message.includes("sale_price")) delete fallbackPayload.sale_price;
      if (error.message.includes("source_url")) delete fallbackPayload.source_url;

      const fallback = await supabase
        .from("products")
        .insert(fallbackPayload)
        .select("id")
        .single();

      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (error || !data) {
      return jsonError(error?.message ?? "Could not add product", 500);
    }

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/");
      revalidatePath("/admin/products");
    } catch {}

    return NextResponse.json({ id: data.id });
  }

  return jsonError("Expected a form submission");
}
