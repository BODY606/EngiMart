import { formatOrderTimestamp } from "@/lib/datetime";
import { matchesProductBilingual } from "@/lib/bilingual-search";

function normalizeSearch(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchesProduct(
  product: { name: string; description?: string; base_price: number },
  query: string,
) {
  return matchesProductBilingual(
    product.name,
    product.description || "",
    product.base_price,
    query,
  );
}

function matchesDate(iso: string, query: string, locale: string) {
  const q = normalizeSearch(query).replace(/[-.]/g, "/");
  if (!q) return true;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const haystack = dateHaystack(date, iso, locale)
    .join("\n")
    .toLowerCase()
    .replace(/[-.]/g, "/");
  return haystack.includes(q);
}

function dateHaystack(date: Date, iso: string, locale: string) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const pad = (value: number) => String(value).padStart(2, "0");
  const enShort = date.toLocaleString("en-US", { month: "short" });
  const enLong = date.toLocaleString("en-US", { month: "long" });
  const arShort = date.toLocaleString("ar-EG", { month: "short" });
  const arLong = date.toLocaleString("ar-EG", { month: "long" });
  return [
    `${day}/${month}`,
    `${day}/${month}/${year}`,
    `${pad(day)}/${pad(month)}`,
    `${pad(day)}/${pad(month)}/${year}`,
    `${month}/${day}`,
    `${pad(month)}/${pad(day)}`,
    `${enShort} ${day}`,
    `${enLong} ${day}`,
    `${enShort} ${day}, ${year}`,
    `${day} ${enShort}`,
    `${day} ${enLong}`,
    `${arShort} ${day}`,
    `${arLong} ${day}`,
    `${year}-${pad(month)}-${pad(day)}`,
    formatOrderTimestamp(iso, "en"),
    formatOrderTimestamp(iso, locale),
  ];
}

export function matchesOrder(
  order: { id: string; created_at: string; order_number?: number | null },
  studentName: string,
  query: string,
  locale: string,
) {
  const q = normalizeSearch(query);
  if (!q) return true;
  if (order.id.toLowerCase().includes(q)) return true;
  if (studentName.toLowerCase().includes(q)) return true;
  if (order.order_number != null) {
    const n = String(order.order_number);
    const hashed = `#${n}`;
    const stripped = q.replace(/^#/, "");
    if (stripped && /\d/.test(stripped) && (hashed.includes(q) || n.includes(stripped))) {
      return true;
    }
  }
  return matchesDate(order.created_at, q, locale);
}

export function matchesRequest(
  request: { id: string; description: string; created_at: string },
  studentName: string,
  query: string,
  locale: string,
) {
  const q = normalizeSearch(query);
  if (!q) return true;
  if (request.id.toLowerCase().includes(q)) return true;
  if (request.description.toLowerCase().includes(q)) return true;
  if (studentName.toLowerCase().includes(q)) return true;
  return matchesDate(request.created_at, q, locale);
}
