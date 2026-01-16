import type { CartLine } from "./cartLine";
import type { CartLineSecure } from "./cartLineSecure";
import type { CartState } from "./cartState";
import type { CartStateSecure } from "./cartLineSecure";

/**
 * Migrate a legacy CartLine to secure format
 *
 * Removes SKU object and stores only the ID
 */
export function migrateCartLine(legacy: CartLine): CartLineSecure {
  return {
    skuId: legacy.sku.id,
    qty: legacy.qty,
    size: legacy.size,
    meta: legacy.meta,
    rental: legacy.rental,
  };
}

/**
 * Migrate an entire cart state from legacy to secure format
 *
 * This function is idempotent - calling it multiple times is safe
 */
export function migrateCartState(cart: CartState | CartStateSecure): CartStateSecure {
  const migrated: CartStateSecure = {};

  for (const [key, line] of Object.entries(cart)) {
    // Check if already in secure format
    if ('skuId' in line) {
      migrated[key] = line as CartLineSecure;
    } else {
      // Legacy format - migrate
      migrated[key] = migrateCartLine(line as CartLine);
    }
  }

  return migrated;
}

/**
 * Check if a cart is already in secure format
 */
export function isSecureCart(cart: CartState | CartStateSecure): cart is CartStateSecure {
  if (Object.keys(cart).length === 0) {
    return true; // Empty cart is compatible with both formats
  }

  // Check first line
  const firstLine = Object.values(cart)[0];
  return 'skuId' in firstLine;
}
