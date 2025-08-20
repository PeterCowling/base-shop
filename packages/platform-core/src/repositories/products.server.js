import "server-only";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ulid } from "ulid";
import { validateShopName } from "../shops/index.js";
import { DATA_ROOT } from "../dataRoot.js";
import { nowIso } from "@acme/date-utils";
function filePath(shop) {
    shop = validateShopName(shop);
    return path.join(DATA_ROOT, shop, "products.json");
}
async function ensureDir(shop) {
    shop = validateShopName(shop);
    await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}
export async function readRepo(shop) {
    try {
        const buf = await fs.readFile(filePath(shop), "utf8");
        return JSON.parse(buf);
    }
    catch {
        return [];
    }
}
export async function writeRepo(shop, catalogue) {
    await ensureDir(shop);
    const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(catalogue, null, 2), "utf8");
    await fs.rename(tmp, filePath(shop));
}
export async function getProductById(shop, id) {
    const catalogue = await readRepo(shop);
    return catalogue.find((p) => p.id === id) ?? null;
}
export async function updateProductInRepo(shop, patch) {
    const catalogue = await readRepo(shop);
    const idx = catalogue.findIndex((p) => p.id === patch.id);
    if (idx === -1)
        throw new Error(`Product ${patch.id} not found in ${shop}`);
    const updated = {
        ...catalogue[idx],
        ...patch,
        row_version: catalogue[idx].row_version + 1,
    };
    catalogue[idx] = updated;
    await writeRepo(shop, catalogue);
    return updated;
}
export async function deleteProductFromRepo(shop, id) {
    const catalogue = await readRepo(shop);
    const next = catalogue.filter((p) => p.id !== id);
    if (next.length === catalogue.length) {
        throw new Error(`Product ${id} not found in ${shop}`);
    }
    await writeRepo(shop, next);
}
export async function duplicateProductInRepo(shop, id) {
    const catalogue = await readRepo(shop);
    const original = catalogue.find((p) => p.id === id);
    if (!original)
        throw new Error(`Product ${id} not found in ${shop}`);
    const now = nowIso();
    const copy = {
        ...original,
        id: ulid(),
        sku: `${original.sku}-copy`,
        status: "draft",
        row_version: 1,
        created_at: now,
        updated_at: now,
    };
    await writeRepo(shop, [copy, ...catalogue]);
    return copy;
}
