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
exports.variantKey = exports.inventoryRepository = void 0;
exports.readInventoryMap = readInventoryMap;
exports.readInventory = readInventory;
exports.writeInventory = writeInventory;
exports.updateInventoryItem = updateInventoryItem;
require("server-only");
const inventory_1 = require("../types/inventory");
Object.defineProperty(exports, "variantKey", { enumerable: true, get: function () { return inventory_1.variantKey; } });
const db_1 = require("../db");
const repoResolver_1 = require("./repoResolver");
let repoPromise;
async function getRepo() {
    if (!repoPromise) {
        repoPromise = (0, repoResolver_1.resolveRepo)(() => db_1.prisma.inventoryItem, () => Promise.resolve().then(() => __importStar(require("./inventory.prisma.server"))).then((m) => m.prismaInventoryRepository), () => Promise.resolve().then(() => __importStar(require("./inventory.json.server"))).then((m) => m.jsonInventoryRepository), { backendEnvVar: "INVENTORY_BACKEND" });
    }
    return repoPromise;
}
exports.inventoryRepository = {
    async read(shop) {
        const repo = await getRepo();
        return repo.read(shop);
    },
    async write(shop, items) {
        const repo = await getRepo();
        const parsed = inventory_1.inventoryItemSchema.array().parse(items);
        return repo.write(shop, parsed);
    },
    async update(shop, sku, variantAttributes, mutate) {
        const repo = await getRepo();
        return repo.update(shop, sku, variantAttributes, mutate);
    },
};
async function readInventoryMap(shop) {
    let items = await exports.inventoryRepository.read(shop);
    if (!Array.isArray(items)) {
        const { jsonInventoryRepository } = await Promise.resolve().then(() => __importStar(require("./inventory.json.server")));
        items = await jsonInventoryRepository.read(shop);
    }
    return Object.fromEntries(items.map((i) => [(0, inventory_1.variantKey)(i.sku, i.variantAttributes), i]));
}
function readInventory(shop) {
    return exports.inventoryRepository.read(shop);
}
function writeInventory(shop, items) {
    const parsed = inventory_1.inventoryItemSchema.array().parse(items);
    return exports.inventoryRepository.write(shop, parsed);
}
function updateInventoryItem(shop, sku, variantAttributes, mutate) {
    return exports.inventoryRepository.update(shop, sku, variantAttributes, mutate);
}
