// packages/lib/checkShopExists.server.ts
import "server-only";

import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "./validateShopName";

function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

const DATA_ROOT = resolveDataRoot();

/** Check if `data/shops/<shop>` exists and is a directory. */
export async function checkShopExists(shop: string): Promise<boolean> {
  shop = validateShopName(shop);
  try {
    const stat = await fs.stat(path.join(DATA_ROOT, shop));
    return stat.isDirectory();
  } catch {
    return false;
  }
}
