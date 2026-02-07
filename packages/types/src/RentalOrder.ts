import { z } from "zod";

/**
 * CAT-01: Line item with inventory allocation tracking.
 * Tracks what was ordered and the before/after quantities at allocation time.
 */
export const orderLineItemSchema = z
  .object({
    /** SKU identifier */
    sku: z.string().min(1),
    /** Product ID (optional, resolved from inventory) */
    productId: z.string().optional(),
    /** Variant attributes (e.g., { size: "M", color: "red" }) */
    variantAttributes: z.record(z.string()).default({}),
    /** Quantity ordered */
    quantity: z.number().int().positive(),
    /** Quantity available before allocation (for audit trail) */
    previousQuantity: z.number().int().nonnegative().optional(),
    /** Quantity available after allocation (for audit trail) */
    nextQuantity: z.number().int().nonnegative().optional(),
  })
  .strict();

export type OrderLineItem = z.infer<typeof orderLineItemSchema>;

export const rentalOrderSchema = z
  .object({
    id: z.string(),
    sessionId: z.string(),
    shop: z.string(),
    deposit: z.number(),
    expectedReturnDate: z.string().optional(),
    returnDueDate: z.string().optional(),
    startedAt: z.string(),
    returnedAt: z.string().optional(),
    returnReceivedAt: z.string().optional(),
    refundedAt: z.string().optional(),
    refundTotal: z.number().optional(),
    /** Optional damage fee deducted from the deposit */
    damageFee: z.number().optional(),
    lateFeeCharged: z.number().optional(),
    fulfilledAt: z.string().optional(),
    shippedAt: z.string().optional(),
    deliveredAt: z.string().optional(),
    cancelledAt: z.string().optional(),
    customerId: z.string().optional(),
    riskLevel: z.string().optional(),
    riskScore: z.number().optional(),
    flaggedForReview: z.boolean().optional(),
    trackingNumber: z.string().optional(),
    labelUrl: z.string().url().optional(),
    returnStatus: z.string().optional(),
    status: z
      .enum(["received", "cleaning", "repair", "qa", "available"])
      .optional(),
    currency: z.string().optional(),
    subtotalAmount: z.number().optional(),
    taxAmount: z.number().optional(),
    shippingAmount: z.number().optional(),
    discountAmount: z.number().optional(),
    totalAmount: z.number().optional(),
    cartId: z.string().optional(),
    stripePaymentIntentId: z.string().optional(),
    stripeChargeId: z.string().optional(),
    stripeBalanceTransactionId: z.string().optional(),
    stripeCustomerId: z.string().optional(),
    /** CAT-01: Line items with inventory allocation tracking */
    lineItems: z.array(orderLineItemSchema).optional(),
  })
  .strict();

export type RentalOrder = z.infer<typeof rentalOrderSchema>;
