import type { SKU } from "@acme/types";

import type { CartStateSecure } from "../cart/cartLineSecure";
import { getProductById } from "../products";

/**
 * Repriced line item with authoritative pricing from database
 *
 * SECURITY: This is the source of truth for checkout pricing.
 * Never trust cart data for pricing.
 */
export interface RepricedLineItem {
  skuId: string;
  title: string;
  quantity: number;
  price: number;        // Fresh from DB
  deposit: number;      // Fresh from DB
  stock: number;        // Fresh from DB
  size?: string;
  sku: SKU;            // Full SKU for reference
}

/**
 * Checkout validation error
 */
export class CheckoutValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly details: Record<string, unknown>,
    message?: string
  ) {
    super(message || `Checkout validation failed: ${code}`);
    this.name = 'CheckoutValidationError';
  }
}

export type RepriceCartOptions = {
  /**
   * Whether to validate stock using SKU.stock.
   *
   * Some checkout flows validate inventory via a dedicated inventory subsystem
   * (e.g. holds / central inventory). In those cases the SKU record may not be
   * the authoritative source of availability.
   */
  validateStock?: boolean;
};

/**
 * Reprice cart with authoritative data from database
 *
 * SECURITY: This is the critical trust boundary. Always call this
 * before creating a Stripe checkout session to ensure pricing is
 * authoritative and not tampered with.
 *
 * @param cart - Cart state (only contains IDs and quantities)
 * @param shopId - Optional shop ID for multi-shop product resolution
 * @returns Array of repriced line items with fresh pricing
 * @throws CheckoutValidationError if any items are invalid
 */
export async function repriceCart(
  cart: CartStateSecure,
  shopId?: string,
  options: RepriceCartOptions = {},
): Promise<RepricedLineItem[]> {
  const validateStock = options.validateStock !== false;
  const items: RepricedLineItem[] = [];
  const errors: Array<{ skuId: string; code: string; message: string }> = [];

  await Promise.all(
    Object.values(cart).map(async (line) => {
      try {
        // SECURITY: Fetch fresh from database, never trust cart
        let sku: SKU | null;
        if (shopId) {
          sku = await getProductById(shopId, line.skuId);
        } else {
          sku = getProductById(line.skuId);
        }

        if (!sku) {
          errors.push({
            skuId: line.skuId,
            code: 'SKU_NOT_FOUND',
            message: `SKU ${line.skuId} not found`,
          });
          return;
        }

        // Validate SKU is available (forSale or forRental)
        if (!sku.forSale && !sku.forRental) {
          errors.push({
            skuId: line.skuId,
            code: 'SKU_INACTIVE',
            message: `SKU ${line.skuId} is no longer available`,
          });
          return;
        }

        if (validateStock) {
          // Validate stock availability
          if (sku.stock < line.qty) {
            errors.push({
              skuId: line.skuId,
              code: 'INSUFFICIENT_STOCK',
              message: `Only ${sku.stock} available (requested ${line.qty})`,
            });
            return;
          }
        }

        // Validate size if required
        if (sku.sizes.length > 0 && !line.size) {
          errors.push({
            skuId: line.skuId,
            code: 'SIZE_REQUIRED',
            message: 'Size selection required',
          });
          return;
        }

        // Build repriced line item with authoritative data
        items.push({
          skuId: sku.id,
          title: sku.title,
          quantity: line.qty,
          price: sku.price,              // ✅ Fresh from DB
          deposit: sku.deposit ?? 0,     // ✅ Fresh from DB
          stock: sku.stock,              // ✅ Fresh from DB
          size: line.size,
          sku,                           // Full SKU for reference
        });
      } catch (error) {
        errors.push({
          skuId: line.skuId,
          code: 'REPRICE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })
  );

  // If any errors occurred, throw with all details
  if (errors.length > 0) {
    throw new CheckoutValidationError(
      'CHECKOUT_VALIDATION_FAILED',
      { errors },
      `${errors.length} item(s) failed validation`
    );
  }

  return items;
}

/**
 * Calculate total from repriced items
 *
 * Useful for displaying total before Stripe session creation
 */
export function calculateTotal(items: RepricedLineItem[]): {
  subtotal: number;
  deposit: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deposit = items.reduce((sum, item) => sum + item.deposit * item.quantity, 0);

  return {
    subtotal,
    deposit,
    total: subtotal + deposit,
  };
}
