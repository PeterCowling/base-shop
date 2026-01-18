"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaShopRepository = void 0;
exports.getShopById = getShopById;
exports.updateShopInRepo = updateShopInRepo;
require("server-only");
const types_1 = require("@acme/types");
const db_1 = require("../db");
async function getShopById(shop) {
    const rec = await db_1.prisma.shop.findUnique({ where: { id: shop } });
    if (!rec) {
        throw new Error(`Shop ${shop} not found`);
    }
    const parsed = types_1.shopSchema.parse(rec.data);
    return parsed;
}
async function updateShopInRepo(shop, patch) {
    const current = await getShopById(shop);
    if (current.id !== patch.id) {
        throw new Error(`Shop ${patch.id} not found in ${shop}`);
    }
    const updated = types_1.shopSchema.parse({ ...current, ...patch });
    await db_1.prisma.shop.upsert({
        where: { id: shop },
        create: { id: shop, data: updated },
        update: { data: updated },
    });
    return updated;
}
exports.prismaShopRepository = {
    getShopById,
    updateShopInRepo,
};
