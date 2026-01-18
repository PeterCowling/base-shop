"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonShopRepository = void 0;
exports.getShopById = getShopById;
exports.getShopJson = getShopById;
exports.updateShopInRepo = updateShopInRepo;
require("server-only");
const types_1 = require("@acme/types");
const safeFs_1 = require("../utils/safeFs");
// shop path is resolved via safeFs helpers
async function ensureDir(shop) {
    await (0, safeFs_1.ensureShopDir)(shop);
}
async function getShopById(shop) {
    try {
        const buf = (await (0, safeFs_1.readFromShop)(shop, "shop.json", "utf8"));
        const data = JSON.parse(buf);
        const parsed = types_1.shopSchema.parse(data);
        return parsed;
    }
    catch {
        throw new Error(`Shop ${shop} not found`);
    }
}
async function updateShopInRepo(shop, patch) {
    const current = await getShopById(shop);
    if (current.id !== patch.id) {
        throw new Error(`Shop ${patch.id} not found in ${shop}`);
    }
    const updated = types_1.shopSchema.parse({ ...current, ...patch });
    await ensureDir(shop);
    const tmp = `shop.json.${Date.now()}.tmp`;
    await (0, safeFs_1.writeToShop)(shop, tmp, JSON.stringify(updated, null, 2), "utf8");
    await (0, safeFs_1.renameInShop)(shop, tmp, "shop.json");
    return updated;
}
exports.jsonShopRepository = {
    getShopById,
    updateShopInRepo,
};
