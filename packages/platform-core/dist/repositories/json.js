import { promises as fs } from "node:fs";
import path from "node:path";
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const DATA_ROOT = path.resolve(process.cwd(), "data", "shops");
/** Path like data/shops/abc/products.json */
function filePath(shop) {
    return path.join(DATA_ROOT, shop, "products.json");
}
/** Ensure `data/shops/<shop>` exists (mkdir -p). */
async function ensureDir(shop) {
    await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}
/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */
/**
 * Read catalogue for a shop (returns empty array if file missing/invalid)
 */
export async function readRepo(shop) {
    try {
        const buf = await fs.readFile(filePath(shop), "utf8");
        return JSON.parse(buf);
    }
    catch {
        // file missing or invalid ⇒ start with empty repo
        return [];
    }
}
/**
 * Write full catalogue atomically
 */
export async function writeRepo(shop, catalogue) {
    await ensureDir(shop);
    const tmp = filePath(shop) + "." + Date.now() + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(catalogue, null, 2), "utf8");
    await fs.rename(tmp, filePath(shop)); // atomic on most POSIX fs
}
