export type Product = {
  id: string;
  name: string;
  description: string;
  base_price: number;
  sale_price?: number | null;
  image_url: string | null;
  images?: string[] | null;
  pdf_url?: string | null;
  is_available: boolean;
  source_url?: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
};

export type FeeType = "flat" | "percentage";

export type PricingTier = {
  id: string;
  tier_min: number;
  tier_max: number | null;
  fee_type: FeeType;
  fee_value: number;
  sort_order: number;
};

export type OrderStatus =
  | "pending"
  | "deposit_paid"
  | "approved"
  | "declined"
  | "completed";

export type Order = {
  id: string;
  order_number: number;
  user_id: string;
  status: OrderStatus;
  items_subtotal: number;
  service_fee: number;
  total_price: number;
  deposit_amount: number;
  transfer_proof_url: string | null;
  hidden_from_admin: boolean;
  decline_reason: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_base_price_at_order_time: number;
};

export type CustomRequestStatus =
  | "pending_review"
  | "priced"
  | "approved"
  | "declined"
  | "completed";

export type CustomOrderRequest = {
  id: string;
  user_id: string;
  description: string;
  suggested_location: string | null;
  status: CustomRequestStatus;
  sourced_price: number | null;
  service_fee: number | null;
  total_price: number | null;
  deposit_amount: number | null;
  order_id: string | null;
  hidden_from_admin: boolean;
  decline_reason: string | null;
  created_at: string;
};

export type CartLine = {
  productId: string;
  name: string;
  basePrice: number;
  imageUrl: string | null;
  quantity: number;
};

export type PriceBreakdown = {
  subtotal: number;
  serviceFee: number;
  total: number;
  deposit: number;
  appliedTier: PricingTier | null;
};
