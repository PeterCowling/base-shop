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
exports.jsonInventoryRepository = void 0;
require("server-only");
const inventory_1 = require("../types/inventory");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const index_1 = require("../shops/index");
const dataRoot_1 = require("../dataRoot");
async function acquireLock(lockFile, { timeoutMs = 5000, staleMs = 60_000, } = {}) {
    const start = Date.now();
    while (true) {
        try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
            return await fs_1.promises.open(lockFile, "wx");
        }
        catch (err) {
            if (err.code !== "EEXIST")
                throw err;
            const elapsed = Date.now() - start;
            if (elapsed >= timeoutMs) {
                // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
                const stat = await fs_1.promises.stat(lockFile).catch(() => undefined);
                const isStale = typeof stat?.mtimeMs === "number" &&
                    Date.now() - stat.mtimeMs > staleMs;
                if (isStale) {
                    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
                    await fs_1.promises.unlink(lockFile).catch(() => { });
                    continue;
                }
                throw new Error(`Timed out acquiring inventory lock ${lockFile} after ${timeoutMs}ms`);
            }
            await new Promise((res) => setTimeout(res, 50));
        }
    }
}
function inventoryPath(shop) {
    shop = (0, index_1.validateShopName)(shop);
    return path.join(dataRoot_1.DATA_ROOT, shop, "inventory.json");
}
async function ensureDir(shop) {
    shop = (0, index_1.validateShopName)(shop);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 path uses validated shop and trusted base
    await fs_1.promises.mkdir(path.join(dataRoot_1.DATA_ROOT, shop), { recursive: true });
}
let stockAlertModule;
async function triggerStockAlert(shop, items) {
    if (process.env.SKIP_STOCK_ALERT === "1")
        return;
    const hasLowStock = items.some((i) => typeof i.lowStockThreshold === "number" &&
        i.quantity <= i.lowStockThreshold);
    if (!hasLowStock)
        return;
    try {
        stockAlertModule ??= Promise.resolve().then(() => __importStar(require("../services/stockAlert.server")));
        const mod = (await stockAlertModule);
        const fn = typeof mod.checkAndAlert === "function"
            ? mod.checkAndAlert
            : typeof mod.default?.checkAndAlert === "function"
                ? mod.default.checkAndAlert
                : undefined;
        if (!fn) {
            throw new Error("stock alert module missing checkAndAlert export"); // i18n-exempt -- developer error, not user-facing
        }
        await fn(shop, items);
    }
    catch (err) {
        console.error(`Failed to trigger stock alert for ${shop}`, err);
    }
}
async function read(shop) {
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
        const buf = await fs_1.promises.readFile(inventoryPath(shop), "utf8");
        const raw = JSON.parse(buf);
        return raw.map(({ variant, variantAttributes, ...rest }) => inventory_1.inventoryItemSchema.parse({
            ...rest,
            variantAttributes: variantAttributes ?? variant ?? {},
        }));
    }
    catch (err) {
        if (err.code === "ENOENT")
            return [];
        console.error(`Failed to read inventory for ${shop}`, err);
        throw err;
    }
}
async function write(shop, items) {
    const normalized = inventory_1.inventoryItemSchema.array().parse(items.map((i) => ({
        ...i,
        variantAttributes: { ...i.variantAttributes },
    })));
    const serialized = normalized.map(({ variantAttributes, ...rest }) => ({
        ...rest,
        ...(Object.keys(variantAttributes).length
            ? { variantAttributes }
            : {}),
    }));
    await ensureDir(shop);
    const lockFile = `${inventoryPath(shop)}.lock`;
    const handle = await acquireLock(lockFile);
    try {
        const tmp = `${inventoryPath(shop)}.${Date.now()}.tmp`;
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
        await fs_1.promises.writeFile(tmp, JSON.stringify(serialized, null, 2), "utf8");
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
        await fs_1.promises.rename(tmp, inventoryPath(shop));
    }
    finally {
        await handle.close();
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
        await fs_1.promises.unlink(lockFile).catch(() => { });
    }
    await triggerStockAlert(shop, normalized);
}
async function update(shop, sku, variantAttributes, mutate) {
    const lockFile = `${inventoryPath(shop)}.lock`;
    await ensureDir(shop);
    let normalized = [];
    const handle = await acquireLock(lockFile);
    let updated;
    try {
        let items = [];
        try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
            const buf = await fs_1.promises.readFile(inventoryPath(shop), "utf8");
            const raw = JSON.parse(buf);
            items = raw.map(({ variant, variantAttributes, ...rest }) => inventory_1.inventoryItemSchema.parse({
                ...rest,
                variantAttributes: variantAttributes ?? variant ?? {},
            }));
        }
        catch (err) {
            if (err.code !== "ENOENT")
                throw err;
        }
        const key = (0, inventory_1.variantKey)(sku, variantAttributes);
        const idx = items.findIndex((i) => (0, inventory_1.variantKey)(i.sku, i.variantAttributes) === key);
        const current = idx === -1 ? undefined : items[idx];
        updated = mutate(current);
        if (updated === undefined) {
            if (idx !== -1)
                items.splice(idx, 1);
        }
        else {
            const nextItem = inventory_1.inventoryItemSchema.parse({
                ...current,
                ...updated,
                sku,
                variantAttributes,
            });
            if (idx === -1)
                items.push(nextItem);
            else
                items[idx] = nextItem;
        }
        normalized = inventory_1.inventoryItemSchema.array().parse(items.map((i) => ({
            ...i,
            variantAttributes: { ...i.variantAttributes },
        })));
        const serialized = normalized.map(({ variantAttributes, ...rest }) => ({
            ...rest,
            ...(Object.keys(variantAttributes).length
                ? { variantAttributes }
                : {}),
        }));
        const tmp = `${inventoryPath(shop)}.${Date.now()}.tmp`;
        await ensureDir(shop);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
        await fs_1.promises.writeFile(tmp, JSON.stringify(serialized, null, 2), "utf8");
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
        await fs_1.promises.rename(tmp, inventoryPath(shop));
    }
    finally {
        await handle.close();
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
        await fs_1.promises.unlink(lockFile).catch(() => { });
    }
    await triggerStockAlert(shop, normalized);
    return updated;
}
exports.jsonInventoryRepository = {
    read,
    write,
    update,
};
// When running under Jest, expose a spyable version of `update` so tests can
// verify that the JSON repository was used as a fallback.
const g = globalThis;
if (g.jest?.fn) {
    exports.jsonInventoryRepository.update = g.jest.fn(exports.jsonInventoryRepository.update);
}
