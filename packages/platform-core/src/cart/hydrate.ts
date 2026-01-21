import type { SKU } from "@acme/types";

import { getProductById } from "../products";

import type { HydratedCartLine } from "./apiTypes";
import { getLineSkuId } from "./apiTypes";
import type { CartStateSecure } from "./cartLineSecure";
import type { CartState } from "./cartState";

/**
 * Hydrate cart lines with fresh SKU data from the database
 *
 * SECURITY: This fetches authoritative pricing data for display.
 * The cart itself stores only IDs.
 *
 * @param cart - Cart state (legacy or secure format)
 * @param shopId - Optional shop ID for multi-shop product resolution
 * @returns Map of hydrated lines keyed by cart line key
 */
export async function hydrateCart(
  cart: CartState | CartStateSecure,
  shopId?: string
): Promise<Record<string, HydratedCartLine>> {
  const hydrated: Record<string, HydratedCartLine> = {};

  await Promise.all(
    Object.entries(cart).map(async ([key, line]) => {
      try {
        // Extract SKU ID from either format
        const skuId = getLineSkuId(line);

        // Fetch fresh SKU data from database
        let sku: SKU | null;
        if (shopId) {
          // Use async shop-scoped lookup
          sku = await getProductById(shopId, skuId);
        } else {
          // Use sync global lookup (legacy)
          sku = getProductById(skuId);
        }

        if (sku) {
          hydrated[key] = {
            line,
            sku, // Fresh data for display
          };
        } else {
          // SKU not found - log but don't fail
          console.warn(`[cart] SKU not found for hydration: ${skuId}`);
        }
      } catch (error) {
        // Hydration failure shouldn't break cart
        console.error(`[cart] Failed to hydrate line ${key}:`, error);
      }
    })
  );

  return hydrated;
}

/**
 * Hydrate a single cart line
 *
 * Useful for single-item operations like add-to-cart
 */
export async function hydrateCartLine(
  line: CartState[string] | CartStateSecure[string],
  shopId?: string
): Promise<HydratedCartLine | null> {
  try {
    const skuId = getLineSkuId(line);

    let sku: SKU | null;
    if (shopId) {
      sku = await getProductById(shopId, skuId);
    } else {
      sku = getProductById(skuId);
    }

    if (!sku) return null;

    return { line, sku };
  } catch (error) {
    console.error('[cart] Failed to hydrate line:', error);
    return null;
  }
}
