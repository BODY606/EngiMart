import { depositFromTotal, roundMoney, toNumber } from "@/lib/money";
import type { PriceBreakdown, PricingTier } from "@/lib/types";

function findTier(
  subtotal: number,
  tiers: PricingTier[],
): PricingTier | null {
  const amount = toNumber(subtotal);
  const sorted = [...tiers].sort((a, b) => a.tier_min - b.tier_min);
  return (
    sorted.find((tier) => {
      const min = toNumber(tier.tier_min);
      const max = tier.tier_max === null ? null : toNumber(tier.tier_max);
      return amount >= min && (max === null || amount <= max);
    }) ?? null
  );
}

function calculateServiceFee(
  subtotal: number,
  tiers: PricingTier[],
): { fee: number; tier: PricingTier | null } {
  const amount = toNumber(subtotal);
  const tier = findTier(amount, tiers);
  if (!tier) return { fee: 0, tier: null };
  if (tier.fee_type === "flat") {
    return { fee: roundMoney(toNumber(tier.fee_value)), tier };
  }
  return {
    fee: roundMoney((amount * toNumber(tier.fee_value)) / 100),
    tier,
  };
}

export function calculateBreakdown(
  subtotal: number,
  tiers: PricingTier[],
): PriceBreakdown {
  const safeSubtotal = roundMoney(toNumber(subtotal));
  const { fee, tier } = calculateServiceFee(safeSubtotal, tiers);
  const total = roundMoney(safeSubtotal + fee);
  return {
    subtotal: safeSubtotal,
    serviceFee: fee,
    total,
    deposit: depositFromTotal(total),
    appliedTier: tier,
  };
}
