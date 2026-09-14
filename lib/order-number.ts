export function formatOrderNumber(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n))) return "";
  return `#${Number(n)}`;
}
