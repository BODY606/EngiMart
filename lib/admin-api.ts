import { jsonError } from "@/lib/api";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export async function requireAdmin(): Promise<
  { ok: true } | { response: NextResponse }
> {
  const ok = await isAdminAuthenticated();
  if (!ok) return { response: jsonError("Admin authentication required", 401) };
  return { ok: true };
}
