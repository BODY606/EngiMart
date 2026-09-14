export function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getWhatsAppPhone(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "").replace(/[^\d]/g, "");
}

export function getContactEmail(): string {
  return (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
