type AccountSource = {
  fullName?: string | null;
  metaName?: string | null;
  email?: string | null;
};

function clean(value: string | null | undefined) {
  if (!value || typeof value !== "string") return "";
  return value.trim();
}

export function accountLabel(source: AccountSource): string {
  const name = clean(source.fullName) || clean(source.metaName);
  if (name && name.toLowerCase() !== "body") return name;
  const email = clean(source.email);
  if (email) return email;
  return "Account";
}

export function accountInitials(label: string) {
  const trimmed = clean(label);
  if (!trimmed) return "?";
  if (trimmed.includes("@")) {
    const local = trimmed.split("@")[0] || trimmed;
    return Array.from(local).slice(0, 2).join("").toUpperCase();
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = Array.from(parts[0])[0] ?? "";
    const last = Array.from(parts[parts.length - 1])[0] ?? "";
    return `${first}${last}`.toUpperCase();
  }
  return Array.from(parts[0] ?? "?").slice(0, 2).join("").toUpperCase();
}
