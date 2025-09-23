import "server-only";

import { promises as fs } from "node:fs";
import * as path from "path";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "./validateShopName";

/**
 * Resolve the data root per invocation to avoid stale paths during dev HMR or
 * process.cwd changes between rebuilds. This keeps behaviour consistent in
 * Next.js development where modules may be re-evaluated under different CWDs.
 */
function getDataRoot(): string {
  return resolveDataRoot();
}

/**
 * Determine whether a shop folder exists under the monorepo’s data root.
 *
 * @param shop the shop code to look up
 * @returns true if a matching directory exists; false otherwise
 */
export async function checkShopExists(shop: string): Promise<boolean> {
  const sanitized = validateShopName(shop);
  try {
    // The shop name is validated above, so joining with DATA_ROOT is safe.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stat = await fs.stat(path.join(getDataRoot(), sanitized));
    return stat.isDirectory();
  } catch {
    return false;
  }
}
