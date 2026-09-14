import { ADMIN_COOKIE } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
