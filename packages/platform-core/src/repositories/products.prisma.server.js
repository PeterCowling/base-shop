"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaProductsRepository = void 0;
require("server-only");
const db_1 = require("../db");
const products_json_server_1 = require("./products.json.server");
function toProduct(record) {
    return record;
}
async function read(shop) {
    const db = db_1.prisma;
    if (!db.product) {
        return products_json_server_1.jsonProductsRepository.read(shop);
    }
    try {
        const rows = await db.product.findMany({ where: { shopId: shop } });
        return rows.map(toProduct);
    }
    catch (err) {
        console.error(`Failed to read products for ${shop}`, err);
        return products_json_server_1.jsonProductsRepository.read(shop);
    }
}
async function getById(shop, id) {
    const db = db_1.prisma;
    if (!db.product) {
        return products_json_server_1.jsonProductsRepository.getById(shop, id);
    }
    try {
        const row = await db.product.findUnique({
            where: { shopId_id: { shopId: shop, id } },
        });
        return row ? toProduct(row) : null;
    }
    catch (err) {
        console.error(`Failed to get product ${id} for ${shop}`, err);
        return products_json_server_1.jsonProductsRepository.getById(shop, id);
    }
}
exports.prismaProductsRepository = {
    read,
    write: products_json_server_1.jsonProductsRepository.write,
    getById,
    update: products_json_server_1.jsonProductsRepository.update,
    delete: products_json_server_1.jsonProductsRepository.delete,
    duplicate: products_json_server_1.jsonProductsRepository.duplicate,
};
