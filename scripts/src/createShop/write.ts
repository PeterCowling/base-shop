// scripts/src/createShop/write.ts
/**
 * Create a shop using the core platform API.  This wrapper is used by
 * higher‑level CLI scripts and tests to trigger shop creation with the
 * appropriate options.  We import from the platform core source directly
 * because the `@acme/*` module aliases are not available in this
 * environment.  The `Options` type is aliased from `CreateShopOptions` to
 * match the original script’s signature.
 */
import {
  createShop,
  type CreateShopOptions,
} from "../../../packages/platform-core/src/createShop";

export type Options = CreateShopOptions;

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
  await createShop(shopId, options);
}
