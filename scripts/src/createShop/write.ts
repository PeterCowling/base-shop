// scripts/src/createShop/write.ts
/**
 * Create a shop using the core platform API.  This wrapper is used by
 * higher‑level CLI scripts and tests to trigger shop creation with the
 * appropriate options.  We import from the platform core source directly
 * because the `@acme/*` module aliases are not available in this
 * environment.  The `Options` type is aliased from `CreateShopOptions` to
 * match the original script’s signature.
 */
import { createShop, type CreateShopOptions } from "@acme/platform-core/createShop";

/**
 * Options accepted by the `writeShop` wrapper.
 *
 * The underlying `createShop` helper accepts a complex configuration object
 * with many properties that default to sensible values. When invoking the
 * CLI we only need to provide whichever fields the user specifies, so this
 * type mirrors `CreateShopOptions` but marks every property optional.
 */
export type Options = Partial<CreateShopOptions>;

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
  // `createShop` will apply defaults for any missing fields, so we can cast
  // the partial options to the full `CreateShopOptions` type when calling it.
  await createShop(shopId, options as CreateShopOptions);
}
