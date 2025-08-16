import { createShop } from "@platform-core/createShop";
import type { Options } from "./parse";

/**
 * Create the shop and write required files.
 */
export async function writeShop(
  shopId: string,
  options: Options
): Promise<void> {
  await createShop(shopId, options);
}
