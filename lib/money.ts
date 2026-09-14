export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatEgp(value: number | string | null | undefined): string {
  const n = roundMoney(toNumber(value));
  return `${n.toLocaleString("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EGP`;
}

export function depositFromTotal(total: number): number {
  return roundMoney(toNumber(total) * 0.5);
}
