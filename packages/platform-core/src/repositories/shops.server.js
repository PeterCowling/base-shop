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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveShopSettings = exports.getShopSettings = exports.diffHistory = void 0;
exports.listShops = listShops;
exports.applyThemeData = applyThemeData;
exports.readShop = readShop;
exports.writeShop = writeShop;
// packages/platform-core/repositories/shops.server.ts
require("server-only");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const types_1 = require("@acme/types");
const defaultFilterMappings_1 = require("../defaultFilterMappings");
const index_1 = require("../themeTokens/index");
const db_1 = require("../db");
const shop_server_1 = require("./shop.server");
const safeFs_1 = require("../utils/safeFs");
const dataRoot_1 = require("../dataRoot");
const shops_1 = require("../shops");
var settings_server_1 = require("./settings.server");
Object.defineProperty(exports, "diffHistory", { enumerable: true, get: function () { return settings_server_1.diffHistory; } });
Object.defineProperty(exports, "getShopSettings", { enumerable: true, get: function () { return settings_server_1.getShopSettings; } });
Object.defineProperty(exports, "saveShopSettings", { enumerable: true, get: function () { return settings_server_1.saveShopSettings; } });
async function listShops(page = 1, limit = 50) {
    const pageNum = Math.max(1, Math.floor(page));
    const limitNum = Math.max(1, Math.floor(limit));
    try {
        const total = await db_1.prisma.shop.count();
        if (total === 0)
            return [];
        const maxPage = Math.max(1, Math.ceil(total / limitNum));
        const safePage = Math.min(pageNum, maxPage);
        const rows = (await db_1.prisma.shop.findMany({
            select: { id: true },
            orderBy: { id: "asc" },
            skip: (safePage - 1) * limitNum,
            take: limitNum,
        }));
        return rows.map((r) => r.id);
    }
    catch {
        try {
            const dirs = await (0, safeFs_1.listShopsInDataRoot)();
            if (dirs.length === 0)
                return [];
            const maxPage = Math.max(1, Math.ceil(dirs.length / limitNum));
            const safePage = Math.min(pageNum, maxPage);
            const start = (safePage - 1) * limitNum;
            return dirs.slice(start, start + limitNum);
        }
        catch {
            return [];
        }
    }
}
async function applyThemeData(data) {
    const defaults = Object.keys(data.themeDefaults ?? {}).length > 0
        ? data.themeDefaults
        : {
            ...index_1.baseTokens,
            ...(await (0, index_1.loadThemeTokens)(data.themeId)),
        };
    const overrides = data.themeOverrides ?? {};
    return {
        ...data,
        themeDefaults: defaults,
        themeOverrides: overrides,
        themeTokens: { ...defaults, ...overrides },
        navigation: data.navigation ?? [],
        termsUrl: data.termsUrl ?? "https://example.com/terms",
        privacyUrl: data.privacyUrl ?? "https://example.com/privacy",
        returnPolicyUrl: data.returnPolicyUrl ?? "https://example.com/returns",
    };
}
async function readShop(shop) {
    try {
        const data = await (0, shop_server_1.getShopById)(shop);
        return await applyThemeData(data);
    }
    catch {
        // Fall through to the layered fallbacks below.
    }
    const normalize = (data) => ({
        ...data,
        id: data.id ?? shop,
        name: data.name ?? shop,
        themeId: data.themeId ?? "base",
        filterMappings: data.filterMappings ?? { ...defaultFilterMappings_1.defaultFilterMappings },
        priceOverrides: data.priceOverrides ?? {},
        localeOverrides: data.localeOverrides ?? {},
        navigation: data.navigation ?? [],
        themeDefaults: data.themeDefaults ?? {},
        themeOverrides: data.themeOverrides ?? {},
    });
    const parseAndApply = async (raw) => {
        const parsed = types_1.shopSchema.safeParse(raw);
        if (!parsed.success)
            return null;
        return applyThemeData(normalize(parsed.data));
    };
    try {
        const row = await db_1.prisma.shop.findUnique({ where: { id: shop } });
        const fromDb = await parseAndApply(row?.data ?? row);
        if (fromDb)
            return fromDb;
    }
    catch {
        // ignore db errors and fall back to filesystem/default
    }
    try {
        const safeShop = (0, shops_1.validateShopName)(shop);
        const fp = path_1.default.join((0, dataRoot_1.resolveDataRoot)(), safeShop, "shop.json");
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated via validateShopName + resolveDataRoot
        const raw = await (0, promises_1.readFile)(fp, "utf8");
        const fromFs = await parseAndApply(JSON.parse(raw));
        if (fromFs)
            return fromFs;
    }
    catch {
        // ignore filesystem errors and fall back to defaults
    }
    const themeId = "base";
    const empty = {
        id: shop,
        name: shop,
        catalogFilters: [],
        themeId,
        themeDefaults: {},
        themeOverrides: {},
        themeTokens: {},
        filterMappings: { ...defaultFilterMappings_1.defaultFilterMappings },
        priceOverrides: {},
        localeOverrides: {},
        navigation: [],
        analyticsEnabled: false,
        coverageIncluded: true,
        componentVersions: {},
        rentalSubscriptions: [],
        subscriptionsEnabled: false,
        luxuryFeatures: {
            blog: false,
            contentMerchandising: false,
            raTicketing: false,
            fraudReviewThreshold: 0,
            requireStrongCustomerAuth: false,
            strictReturnConditions: false,
            trackingDashboard: false,
            premierDelivery: false,
        },
    };
    return await applyThemeData(empty);
}
async function writeShop(shop, patch) {
    const { readShop } = await Promise.resolve().then(() => __importStar(require("./shops.server")));
    const current = await readShop(shop);
    const themeDefaults = {
        ...(current.themeDefaults ?? {}),
        ...(patch.themeDefaults ?? {}),
    };
    const themeOverrides = {
        ...(current.themeOverrides ?? {}),
        ...(patch.themeOverrides ?? {}),
    };
    for (const [k, v] of Object.entries(themeOverrides)) {
        if (v == null || v === themeDefaults[k])
            delete themeOverrides[k];
    }
    const themeTokens = { ...themeDefaults, ...themeOverrides };
    const updated = await (0, shop_server_1.updateShopInRepo)(shop, {
        ...patch,
        id: patch.id,
        themeDefaults,
        themeOverrides,
        themeTokens,
    });
    return applyThemeData(updated);
}
