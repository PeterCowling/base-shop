import "server-only";

import { promises as fs } from "node:fs";
import * as path from "path";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "./validateShopName";

/** The root directory containing shop data */
const DATA_ROOT = resolveDataRoot();

/**
 * Determine whether a shop folder exists under the monorepo’s data root.
 *
 * @param shop the shop code to look up
 * @returns true if a matching directory exists; false otherwise
 */
export async function checkShopExists(shop: string): Promise<boolean> {
  const sanitized = validateShopName(shop);
  try {
    const stat = await fs.stat(path.join(DATA_ROOT, sanitized));
    return stat.isDirectory();
  } catch {
    return false;
  }
}
