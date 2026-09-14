import { createBrowserClient } from "@supabase/ssr";
import { hasPublicSupabaseConfig } from "@/lib/env";

export function createClient() {
  if (!hasPublicSupabaseConfig()) {
    throw new Error("Supabase is not configured.");
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
