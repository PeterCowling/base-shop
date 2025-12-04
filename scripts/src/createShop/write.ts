// scripts/src/createShop/write.ts
/**
 * Create a shop using the core platform API.  This wrapper is used by
 * higher‑level CLI scripts and tests to trigger shop creation with the
 * appropriate options.  We import from the platform core source directly
 * because the `@acme/*` module aliases are not available in this
 * environment.  The `Options` type is aliased from `ShopConfig` to
 * match the original script’s signature.
 */
import { createShopFromConfig } from "@acme/platform-core/createShop";
import type { ShopConfig } from "@acme/types";

/**
 * Options accepted by the `writeShop` wrapper.
 *
 * The underlying `createShopFromConfig` helper accepts a configuration object
 * with many properties that default to sensible values. When invoking the
 * CLI we only need to provide whichever fields the user specifies, so this
 * type mirrors `ShopConfig` but marks every property optional.
 */
export type Options = Partial<ShopConfig>;

/**
 * Create the shop and write required files.
 *
 * @param shopId - The identifier for the new shop (without `shop-` prefix).
 * @param options - Optional configuration controlling the shop scaffold.
 */
export async function writeShop(
  shopId: string,
  options: Options
): Promise<void> {
  await createShopFromConfig(shopId, options as ShopConfig, { deploy: true });
}
