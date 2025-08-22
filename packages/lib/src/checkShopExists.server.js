// packages/lib/checkShopExists.server.ts
import "server-only";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { validateShopName } from "./validateShopName";
const DATA_ROOT = resolveDataRoot();
/** Check if `data/shops/<shop>` exists and is a directory. */
export async function checkShopExists(shop) {
    shop = validateShopName(shop);
    try {
        const stat = await fs.stat(path.join(DATA_ROOT, shop));
        return stat.isDirectory();
    }
    catch {
        return false;
    }
}
