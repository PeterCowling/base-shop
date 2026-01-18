"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaInventoryRepository = void 0;
require("server-only");
const db_1 = require("../db");
const inventory_1 = require("../types/inventory");
function toInventoryItem(record) {
    const r = record;
    return inventory_1.inventoryItemSchema.parse({
        sku: r.sku,
        productId: r.productId,
        quantity: r.quantity,
        variantAttributes: r.variantAttributes ?? {},
        ...(r.lowStockThreshold !== null
            ? { lowStockThreshold: r.lowStockThreshold }
            : {}),
        ...(r.wearCount !== null ? { wearCount: r.wearCount } : {}),
        ...(r.wearAndTearLimit !== null
            ? { wearAndTearLimit: r.wearAndTearLimit }
            : {}),
        ...(r.maintenanceCycle !== null
            ? { maintenanceCycle: r.maintenanceCycle }
            : {}),
    });
}
async function read(shop) {
    const db = db_1.prisma;
    if (!db.inventoryItem) {
        throw new Error("Prisma inventory delegate is unavailable");
    }
    try {
        const rows = await db.inventoryItem.findMany({
            where: { shopId: shop },
        });
        return rows.map(toInventoryItem);
    }
    catch (err) {
        console.error(`Failed to read inventory for ${shop}`, err);
        throw err;
    }
}
async function write(shop, items) {
    const db = db_1.prisma;
    if (!db.inventoryItem) {
        throw new Error("Prisma inventory delegate is unavailable");
    }
    const normalized = inventory_1.inventoryItemSchema.array().parse(items);
    try {
        await db.$transaction(async (tx) => {
            await tx.inventoryItem.deleteMany({ where: { shopId: shop } });
            if (normalized.length) {
                await tx.inventoryItem.createMany({
                    data: normalized.map((i) => ({
                        shopId: shop,
                        sku: i.sku,
                        productId: i.productId,
                        quantity: i.quantity,
                        variantAttributes: i.variantAttributes,
                        lowStockThreshold: i.lowStockThreshold ?? null,
                        wearCount: i.wearCount ?? null,
                        wearAndTearLimit: i.wearAndTearLimit ?? null,
                        maintenanceCycle: i.maintenanceCycle ?? null,
                        variantKey: (0, inventory_1.variantKey)(i.sku, i.variantAttributes),
                    })),
                });
            }
        });
        const hasLowStock = normalized.some((i) => typeof i.lowStockThreshold === "number" &&
            i.quantity <= i.lowStockThreshold);
        if (process.env.SKIP_STOCK_ALERT !== "1" && hasLowStock) {
            const { checkAndAlert } = await Promise.resolve().then(() => __importStar(require("../services/stockAlert.server")));
            await checkAndAlert(shop, normalized);
        }
    }
    catch (err) {
        console.error(`Failed to write inventory for ${shop}`, err);
        throw err;
    }
}
async function update(shop, sku, variantAttributes, mutate) {
    const db = db_1.prisma;
    if (!db.inventoryItem) {
        throw new Error("Prisma inventory delegate is unavailable");
    }
    const key = (0, inventory_1.variantKey)(sku, variantAttributes);
    try {
        const result = await db.$transaction(async (tx) => {
            const record = await tx.inventoryItem.findUnique({
                where: { shopId_sku_variantKey: { shopId: shop, sku, variantKey: key } },
            });
            const current = record ? toInventoryItem(record) : undefined;
            const updated = mutate(current);
            if (updated === undefined) {
                if (record) {
                    await tx.inventoryItem.delete({
                        where: { shopId_sku_variantKey: { shopId: shop, sku, variantKey: key } },
                    });
                }
                const remaining = await tx.inventoryItem.findMany({ where: { shopId: shop } });
                return { updated: undefined, all: remaining.map(toInventoryItem) };
            }
            const nextItem = inventory_1.inventoryItemSchema.parse({
                ...current,
                ...updated,
                sku,
                variantAttributes,
            });
            await tx.inventoryItem.upsert({
                where: { shopId_sku_variantKey: { shopId: shop, sku, variantKey: key } },
                update: {
                    productId: nextItem.productId,
                    quantity: nextItem.quantity,
                    variantAttributes: nextItem.variantAttributes,
                    lowStockThreshold: nextItem.lowStockThreshold ?? null,
                    wearCount: nextItem.wearCount ?? null,
                    wearAndTearLimit: nextItem.wearAndTearLimit ?? null,
                    maintenanceCycle: nextItem.maintenanceCycle ?? null,
                    variantKey: key,
                },
                create: {
                    shopId: shop,
                    sku: nextItem.sku,
                    productId: nextItem.productId,
                    quantity: nextItem.quantity,
                    variantAttributes: nextItem.variantAttributes,
                    lowStockThreshold: nextItem.lowStockThreshold ?? null,
                    wearCount: nextItem.wearCount ?? null,
                    wearAndTearLimit: nextItem.wearAndTearLimit ?? null,
                    maintenanceCycle: nextItem.maintenanceCycle ?? null,
                    variantKey: key,
                },
            });
            const remaining = await tx.inventoryItem.findMany({ where: { shopId: shop } });
            return { updated: nextItem, all: remaining.map(toInventoryItem) };
        });
        const { updated, all } = result;
        const hasLowStock = all.some((i) => typeof i.lowStockThreshold === "number" &&
            i.quantity <= i.lowStockThreshold);
        if (process.env.SKIP_STOCK_ALERT !== "1" && hasLowStock) {
            const { checkAndAlert } = await Promise.resolve().then(() => __importStar(require("../services/stockAlert.server")));
            await checkAndAlert(shop, all);
        }
        return updated;
    }
    catch (err) {
        console.error(`Failed to update inventory for ${shop}`, err);
        throw err;
    }
}
exports.prismaInventoryRepository = {
    read,
    write,
    update,
};
