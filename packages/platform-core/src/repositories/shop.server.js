import "server-only";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { shopSchema } from "@acme/types";
import { prisma } from "../db.js";
import { validateShopName } from "../shops/index.js";
import { DATA_ROOT } from "../dataRoot.js";
function shopPath(shop) {
    shop = validateShopName(shop);
    return path.join(DATA_ROOT, shop, "shop.json");
}
async function ensureDir(shop) {
    shop = validateShopName(shop);
    await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}
export async function getShopById(shop) {
    try {
        const rec = await prisma.shop.findUnique({ where: { id: shop } });
        if (rec)
            return shopSchema.parse(rec.data);
    }
    catch {
        // ignore DB errors and fall back
    }
    try {
        const buf = await fs.readFile(shopPath(shop), "utf8");
        return shopSchema.parse(JSON.parse(buf));
    }
    catch {
        throw new Error(`Shop ${shop} not found`);
    }
}
export async function updateShopInRepo(shop, patch) {
    const current = await getShopById(shop);
    if (current.id !== patch.id) {
        throw new Error(`Shop ${patch.id} not found in ${shop}`);
    }
    const updated = { ...current, ...patch };
    try {
        await prisma.shop.upsert({
            where: { id: shop },
            create: { id: shop, data: updated },
            update: { data: updated },
        });
        return updated;
    }
    catch {
        // fall back to filesystem persistence
    }
    await ensureDir(shop);
    const tmp = `${shopPath(shop)}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(updated, null, 2), "utf8");
    await fs.rename(tmp, shopPath(shop));
    return updated;
}
