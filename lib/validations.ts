import { z } from "zod";

export function normalizeEgyptianPhone(input: string): string {
  let clean = input.replace(/[^\d]/g, "");
  if (clean.startsWith("0020")) {
    clean = `0${clean.slice(4)}`;
  } else if (clean.startsWith("20") && clean.length === 12) {
    clean = `0${clean.slice(2)}`;
  }
  return clean;
}

export function isValidEgyptianPhone(input: string): boolean {
  const norm = normalizeEgyptianPhone(input);
  return /^01[0125]\d{8}$/.test(norm);
}

export const phoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => isValidEgyptianPhone(val),
    "يجب إدخال رقم هاتف مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015 (11 رقماً)",
  )
  .transform((val) => normalizeEgyptianPhone(val));

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(80),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Your cart is empty"),
});

export const customRequestSchema = z.object({
  description: z
    .string()
    .trim()
    .min(8, "Describe the item in a bit more detail")
    .max(2000),
  suggestedLocation: z.string().trim().max(300).optional().or(z.literal("")),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(""),
  basePrice: z.coerce.number().min(0).max(1_000_000),
  salePrice: z.coerce.number().min(0).max(1_000_000).optional().nullable(),
  imageUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
  sourceUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
  isAvailable: z.boolean().optional(),
});

export const pricingTierSchema = z.object({
  id: z.string().uuid().optional(),
  tierMin: z.coerce.number().min(0),
  tierMax: z.union([z.coerce.number().min(0), z.null()]),
  feeType: z.enum(["flat", "percentage"]),
  feeValue: z.coerce.number().min(0),
  sortOrder: z.coerce.number().int().min(0),
});

export const pricingUpdateSchema = z.object({
  tiers: z.array(pricingTierSchema).min(1),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Enter the password").max(200),
});

export const orderStatusSchema = z.enum([
  "pending",
  "deposit_paid",
  "approved",
  "declined",
  "completed",
]);

export const customStatusSchema = z.enum([
  "pending_review",
  "priced",
  "approved",
  "declined",
  "completed",
]);
