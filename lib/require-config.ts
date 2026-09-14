import { hasPublicSupabaseConfig } from "@/lib/env";
import { redirect } from "next/navigation";

export function assertConfigured() {
  if (!hasPublicSupabaseConfig()) redirect("/");
}
