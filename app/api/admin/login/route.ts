import { adminCookieOptions, ADMIN_COOKIE, createAdminToken, verifyAdminPassword } from "@/lib/admin-session";
import { jsonError } from "@/lib/api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  try {
    const valid = await verifyAdminPassword(body);
    if (!valid) return jsonError("Wrong password", 401);
    const token = await createAdminToken();
    const store = await cookies();
    store.set(ADMIN_COOKIE, token, adminCookieOptions());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Admin login is not configured",
      500,
    );
  }
}
