import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { adminLoginSchema } from "@/lib/validations";

export const ADMIN_COOKIE = "engimart_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 3;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET is missing or too short.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function verifyAdminPassword(input: unknown): Promise<boolean> {
  const parsed = adminLoginSchema.safeParse(input);
  if (!parsed.success) return false;
  const raw = process.env.ADMIN_PASSWORD_HASH;
  if (!raw) {
    throw new Error("ADMIN_PASSWORD_HASH is not configured.");
  }
  const hash = raw.replaceAll("\\$", "$").trim();
  if (!hash.startsWith("$2") || hash.length < 59) {
    throw new Error(
      "ADMIN_PASSWORD_HASH is truncated. Escape every $ as \\$ in .env.local, then restart the server.",
    );
  }
  return compare(parsed.data.password, hash);
}
