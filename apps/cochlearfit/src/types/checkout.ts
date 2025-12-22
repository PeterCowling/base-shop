import type { CurrencyCode, ProductColor, ProductSize } from "@/types/product";

export type CheckoutItem = {
  variantId: string;
  name: string;
  size: ProductSize;
  color: ProductColor;
  quantity: number;
  unitPrice: number;
  currency: CurrencyCode;
};

export type CheckoutSessionResponse = {
  id: string;
  status: "open" | "complete" | "expired" | "unknown";
  paymentStatus: "paid" | "unpaid" | "no_payment_required" | "unknown";
  total: number;
  currency: CurrencyCode;
  items: CheckoutItem[];
};
