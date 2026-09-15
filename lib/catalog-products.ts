import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types";
import { unstable_cache } from "next/cache";

export const getCatalogProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false },
      });

      let { data, error } = await supabase
        .from("products")
        .select(
          "id, name, description, base_price, sale_price, image_url, images, pdf_url, is_available, created_at",
        )
        .order("created_at", { ascending: true })
        .abortSignal(controller.signal);

      if (
        error &&
        (error.code === "42703" ||
          error.message.includes("images") ||
          error.message.includes("pdf_url") ||
          error.message.includes("sale_price") ||
          error.message.includes("schema cache") ||
          error.message.includes("column"))
      ) {
        const fallbackRes = await supabase
          .from("products")
          .select("id, name, description, base_price, sale_price, image_url, is_available, created_at")
          .order("created_at", { ascending: true })
          .abortSignal(controller.signal);

        if (
          fallbackRes.error &&
          (fallbackRes.error.code === "42703" ||
            fallbackRes.error.message.includes("sale_price") ||
            fallbackRes.error.message.includes("column"))
        ) {
          const minimalRes = await supabase
            .from("products")
            .select("id, name, description, base_price, image_url, is_available, created_at")
            .order("created_at", { ascending: true })
            .abortSignal(controller.signal);
          data = (minimalRes.data as unknown as typeof data) ?? null;
          error = minimalRes.error;
        } else {
          data = (fallbackRes.data as unknown as typeof data) ?? null;
          error = fallbackRes.error;
        }
      }

      clearTimeout(timeoutId);

      if (error || !data) {
        return [];
      }

      return data as Product[];
    } catch {
      clearTimeout(timeoutId);
      return [];
    }
  },
  ["catalog-products"],
  { revalidate: 60, tags: ["products"] },
);

