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
exports.jsonProductsRepository = void 0;
require("server-only");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const ulid_1 = require("ulid");
const index_1 = require("../shops/index");
const dataRoot_1 = require("../dataRoot");
const date_utils_1 = require("@acme/date-utils");
function filePath(shop) {
    shop = (0, index_1.validateShopName)(shop);
    return path.join(dataRoot_1.DATA_ROOT, shop, "products.json");
}
async function ensureDir(shop) {
    shop = (0, index_1.validateShopName)(shop);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
    await fs_1.promises.mkdir(path.join(dataRoot_1.DATA_ROOT, shop), { recursive: true });
}
async function read(shop) {
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
        const buf = await fs_1.promises.readFile(filePath(shop), "utf8");
        return JSON.parse(buf);
    }
    catch {
        return [];
    }
}
async function write(shop, catalogue) {
    await ensureDir(shop);
    const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
    await fs_1.promises.writeFile(tmp, JSON.stringify(catalogue, null, 2), "utf8");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Path built from DATA_ROOT + validated shop name
    await fs_1.promises.rename(tmp, filePath(shop));
}
async function getById(shop, id) {
    const catalogue = await read(shop);
    return catalogue.find((p) => p.id === id) ?? null;
}
async function update(shop, patch) {
    const catalogue = await read(shop);
    const idx = catalogue.findIndex((p) => p.id === patch.id);
    if (idx === -1)
        throw new Error(`Product ${patch.id} not found in ${shop}`);
    const updated = {
        ...catalogue[idx],
        ...patch,
        row_version: catalogue[idx].row_version + 1,
    };
    catalogue[idx] = updated;
    await write(shop, catalogue);
    return updated;
}
async function remove(shop, id) {
    const catalogue = await read(shop);
    const next = catalogue.filter((p) => p.id !== id);
    if (next.length === catalogue.length) {
        throw new Error(`Product ${id} not found in ${shop}`);
    }
    await write(shop, next);
}
async function duplicate(shop, id) {
    const catalogue = await read(shop);
    const original = catalogue.find((p) => p.id === id);
    if (!original)
        throw new Error(`Product ${id} not found in ${shop}`);
    const now = (0, date_utils_1.nowIso)();
    const copy = {
        ...original,
        id: (0, ulid_1.ulid)(),
        sku: `${original.sku}-copy`,
        status: "draft",
        row_version: 1,
        created_at: now,
        updated_at: now,
    };
    await write(shop, [copy, ...catalogue]);
    return copy;
}
exports.jsonProductsRepository = {
    read,
    write,
    getById,
    update,
    delete: remove,
    duplicate,
};
