import "server-only";

import {
  createInventoryHold,
  InventoryBusyError,
  InventoryHoldInsufficientError,
  releaseInventoryHold,
} from "../inventoryHolds";
import {
  cartToInventoryRequests,
  type InventoryValidationRequest,
  validateInventoryAvailability,
  validateInventoryFromCentral,
} from "../inventoryValidation";
import { validateShopName } from "../shops";

import type { CartState } from "./cartState";

// ============================================================
// Types
// ============================================================

export interface CartValidationOptions {
  /** Shop ID to validate against */
  shopId: string;
  /** Cart state to validate */
  cart: CartState;
  /** Whether to use central inventory (if available) */
  useCentralInventory?: boolean;
  /** Create a reservation hold (for checkout) */
  createHold?: boolean;
  /** TTL for hold in seconds (default: 1200 = 20 minutes) */
  holdTtlSeconds?: number;
}

export interface CartValidationSuccess {
  valid: true;
  /** Hold ID if createHold was true */
  holdId?: string;
  /** Hold expiration if createHold was true */
  holdExpiresAt?: Date;
  /** Items that were validated */
  items: CartValidationItem[];
}

export interface CartValidationFailure {
  valid: false;
  /** Error code for programmatic handling */
  code: CartValidationErrorCode;
  /** Human-readable error message */
  message: string;
  /** Items with insufficient stock */
  insufficientItems: CartValidationInsufficientItem[];
  /** Suggested recovery actions */
  recovery: CartValidationRecovery[];
  /** Whether the error is retryable */
  retryable: boolean;
  /** Retry-after in milliseconds (for busy errors) */
  retryAfterMs?: number;
}

export type CartValidationResult = CartValidationSuccess | CartValidationFailure;

export interface CartValidationItem {
  sku: string;
  variantKey: string;
  variantAttributes: Record<string, string>;
  requestedQuantity: number;
  availableQuantity: number;
}

export interface CartValidationInsufficientItem extends CartValidationItem {
  /** Shortfall amount */
  shortfall: number;
}

export type CartValidationErrorCode =
  | "EMPTY_CART"
  | "INSUFFICIENT_STOCK"
  | "INVENTORY_BUSY"
  | "INVENTORY_UNAVAILABLE"
  | "VALIDATION_ERROR";

export interface CartValidationRecovery {
  type: "REDUCE_QUANTITY" | "REMOVE_ITEM" | "RETRY" | "CONTACT_SUPPORT";
  sku?: string;
  variantKey?: string;
  suggestedQuantity?: number;
  message: string;
}

// ============================================================
// Main Validation Function
// ============================================================

/**
 * Validate cart contents against available inventory.
 *
 * This is the unified entry point for all cart validation scenarios:
 * - Pre-checkout validation (read-only)
 * - Checkout with hold creation (reservation)
 * - Add-to-cart validation
 *
 * @example
 * ```ts
 * // Pre-checkout validation (no hold)
 * const result = await validateCart({
 *   shopId: "my-shop",
 *   cart: cartState,
 * });
 *
 * // Checkout with hold creation
 * const result = await validateCart({
 *   shopId: "my-shop",
 *   cart: cartState,
 *   createHold: true,
 *   holdTtlSeconds: 1200,
 * });
 *
 * if (!result.valid) {
 *   // Handle insufficient stock
 *   console.log(result.insufficientItems);
 *   console.log(result.recovery);
 * }
 * ```
 */
export async function validateCart(
  options: CartValidationOptions
): Promise<CartValidationResult> {
  const {
    shopId: rawShopId,
    cart,
    useCentralInventory = true,
    createHold = false,
    holdTtlSeconds = 1200,
  } = options;

  // Validate shop ID
  let shopId: string;
  try {
    shopId = validateShopName(rawShopId);
  } catch {
    return createFailure("VALIDATION_ERROR", "Invalid shop ID", [], false);
  }

  // Check for empty cart
  const cartKeys = Object.keys(cart);
  if (cartKeys.length === 0) {
    return createFailure("EMPTY_CART", "Cart is empty", [], false);
  }

  // Convert cart to inventory requests
  const requests = cartToInventoryRequests(cart);

  // If hold creation is requested, use the hold system
  if (createHold) {
    return validateWithHold(shopId, requests, holdTtlSeconds);
  }

  // Otherwise, do read-only validation
  return validateReadOnly(shopId, requests, useCentralInventory);
}

// ============================================================
// Hold-Based Validation (for checkout)
// ============================================================

async function validateWithHold(
  shopId: string,
  requests: InventoryValidationRequest[],
  ttlSeconds: number
): Promise<CartValidationResult> {
  try {
    const { holdId, expiresAt } = await createInventoryHold({
      shopId,
      requests,
      ttlSeconds,
    });

    // Build success response with validated items
    const items: CartValidationItem[] = requests.map((req) => ({
      sku: req.sku,
      variantKey: buildVariantKey(req.sku, req.variantAttributes ?? {}),
      variantAttributes: req.variantAttributes ?? {},
      requestedQuantity: req.quantity,
      availableQuantity: req.quantity, // Hold created means stock was available
    }));

    return {
      valid: true,
      holdId,
      holdExpiresAt: expiresAt,
      items,
    };
  } catch (error) {
    // Handle insufficient stock from hold creation
    if (error instanceof InventoryHoldInsufficientError) {
      const insufficientItems: CartValidationInsufficientItem[] =
        error.insufficient.map((item) => ({
          sku: item.sku,
          variantKey: item.variantKey,
          variantAttributes: item.variantAttributes,
          requestedQuantity: item.requested,
          availableQuantity: item.available,
          shortfall: item.requested - item.available,
        }));

      const recovery = buildRecoveryActions(insufficientItems);

      return createFailure(
        "INSUFFICIENT_STOCK",
        buildInsufficientStockMessage(insufficientItems),
        insufficientItems,
        false,
        recovery
      );
    }

    // Handle database busy/lock errors
    if (error instanceof InventoryBusyError) {
      return createFailure(
        "INVENTORY_BUSY",
        "Inventory system is temporarily busy. Please try again.",
        [],
        true,
        [{ type: "RETRY", message: "Try again in a moment" }],
        error.retryAfterMs
      );
    }

    // Handle other errors
    return createFailure(
      "INVENTORY_UNAVAILABLE",
      "Unable to validate inventory. Please try again later.",
      [],
      true,
      [{ type: "RETRY", message: "Try again in a moment" }]
    );
  }
}

// ============================================================
// Read-Only Validation
// ============================================================

async function validateReadOnly(
  shopId: string,
  requests: InventoryValidationRequest[],
  useCentralInventory: boolean
): Promise<CartValidationResult> {
  try {
    const result = useCentralInventory
      ? await validateInventoryFromCentral(shopId, requests)
      : await validateInventoryAvailability(shopId, requests);

    if (result.ok) {
      const items: CartValidationItem[] = requests.map((req) => ({
        sku: req.sku,
        variantKey: buildVariantKey(req.sku, req.variantAttributes ?? {}),
        variantAttributes: req.variantAttributes ?? {},
        requestedQuantity: req.quantity,
        availableQuantity: req.quantity, // Validated as available
      }));

      return { valid: true, items };
    }

    // Validation failed - build detailed response
    const insufficientItems: CartValidationInsufficientItem[] =
      result.insufficient.map((item) => ({
        sku: item.sku,
        variantKey: item.variantKey,
        variantAttributes: item.variantAttributes,
        requestedQuantity: item.requested,
        availableQuantity: item.available,
        shortfall: item.requested - item.available,
      }));

    const recovery = buildRecoveryActions(insufficientItems);

    return createFailure(
      "INSUFFICIENT_STOCK",
      buildInsufficientStockMessage(insufficientItems),
      insufficientItems,
      false,
      recovery
    );
  } catch {
    return createFailure(
      "INVENTORY_UNAVAILABLE",
      "Unable to validate inventory. Please try again later.",
      [],
      true,
      [{ type: "RETRY", message: "Try again in a moment" }]
    );
  }
}

// ============================================================
// Helper: Release Hold
// ============================================================

/**
 * Release a previously created inventory hold.
 * Call this if checkout fails or user abandons cart.
 */
export async function releaseCartHold(
  shopId: string,
  holdId: string
): Promise<{ released: boolean; reason?: string }> {
  const safeShopId = validateShopName(shopId);
  const result = await releaseInventoryHold({ shopId: safeShopId, holdId });

  if (result.ok) {
    return { released: true };
  }

  return { released: false, reason: result.reason };
}

// ============================================================
// Helper: Validate Single Item
// ============================================================

/**
 * Validate a single item before adding to cart.
 * Useful for add-to-cart validation.
 */
export async function validateCartItem(
  shopId: string,
  sku: string,
  quantity: number,
  variantAttributes?: Record<string, string>
): Promise<CartValidationResult> {
  const requests: InventoryValidationRequest[] = [
    { sku, quantity, variantAttributes },
  ];

  const safeShopId = validateShopName(shopId);
  return validateReadOnly(safeShopId, requests, true);
}

// ============================================================
// Utilities
// ============================================================

function createFailure(
  code: CartValidationErrorCode,
  message: string,
  insufficientItems: CartValidationInsufficientItem[],
  retryable: boolean,
  recovery: CartValidationRecovery[] = [],
  retryAfterMs?: number
): CartValidationFailure {
  return {
    valid: false,
    code,
    message,
    insufficientItems,
    recovery: recovery.length > 0 ? recovery : buildDefaultRecovery(retryable),
    retryable,
    retryAfterMs,
  };
}

function buildDefaultRecovery(retryable: boolean): CartValidationRecovery[] {
  if (retryable) {
    return [{ type: "RETRY", message: "Try again in a moment" }];
  }
  return [
    { type: "CONTACT_SUPPORT", message: "Contact support for assistance" },
  ];
}

function buildRecoveryActions(
  insufficientItems: CartValidationInsufficientItem[]
): CartValidationRecovery[] {
  const recovery: CartValidationRecovery[] = [];

  for (const item of insufficientItems) {
    if (item.availableQuantity > 0) {
      // Some stock available - suggest reducing quantity
      recovery.push({
        type: "REDUCE_QUANTITY",
        sku: item.sku,
        variantKey: item.variantKey,
        suggestedQuantity: item.availableQuantity,
        message: `Reduce quantity to ${item.availableQuantity}`,
      });
    } else {
      // No stock - suggest removing item
      recovery.push({
        type: "REMOVE_ITEM",
        sku: item.sku,
        variantKey: item.variantKey,
        message: `Remove item (out of stock)`,
      });
    }
  }

  return recovery;
}

function buildInsufficientStockMessage(
  items: CartValidationInsufficientItem[]
): string {
  if (items.length === 1) {
    const item = items[0];
    if (item.availableQuantity === 0) {
      return `Item ${item.sku} is out of stock`;
    }
    return `Only ${item.availableQuantity} available for ${item.sku} (requested ${item.requestedQuantity})`;
  }

  return `${items.length} items have insufficient stock`;
}

function buildVariantKey(
  sku: string,
  attrs: Record<string, string>
): string {
  const keys = Object.keys(attrs).sort();
  if (keys.length === 0) return sku;
  const pairs = keys.map((k) => `${k}:${attrs[k]}`).join("|");
  return `${sku}#${pairs}`;
}
