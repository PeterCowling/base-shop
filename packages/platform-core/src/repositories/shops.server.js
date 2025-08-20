// packages/platform-core/repositories/shops.server.ts
import "server-only";
import { shopSchema } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { prisma } from "../db.js";
import { defaultFilterMappings } from "../defaultFilterMappings.js";
import { validateShopName } from "../shops/index.js";
import { DATA_ROOT } from "../dataRoot.js";
import { baseTokens, loadThemeTokens } from "../themeTokens/index.js";
import { updateShopInRepo } from "./shop.server.js";
export { diffHistory, getShopSettings, saveShopSettings, } from "./settings.server.js";
function shopPath(shop) {
    shop = validateShopName(shop);
    return path.join(DATA_ROOT, shop, "shop.json");
}
async function ensureDir(shop) {
    shop = validateShopName(shop);
    await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}
async function applyThemeData(data) {
    const defaults = Object.keys(data.themeDefaults ?? {}).length > 0
        ? data.themeDefaults
        : {
            ...baseTokens,
            ...(await loadThemeTokens(data.themeId)),
        };
    const overrides = data.themeOverrides ?? {};
    return {
        ...data,
        themeDefaults: defaults,
        themeOverrides: overrides,
        themeTokens: { ...defaults, ...overrides },
        navigation: data.navigation ?? [],
    };
}
export async function readShop(shop) {
    try {
        const rec = await prisma.shop.findUnique({ where: { id: shop } });
        if (rec) {
            const data = shopSchema.parse(rec.data);
            return await applyThemeData(data);
        }
    }
    catch {
        // ignore DB errors and fall back to filesystem
    }
    try {
        const buf = await fs.readFile(shopPath(shop), "utf8");
        const parsed = shopSchema.safeParse(JSON.parse(buf));
        if (parsed.success && parsed.data.id) {
            return await applyThemeData(parsed.data);
        }
    }
    catch {
        // ignore
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
        filterMappings: { ...defaultFilterMappings },
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
export async function writeShop(shop, patch) {
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
    const updated = await updateShopInRepo(shop, {
        ...patch,
        themeDefaults,
        themeOverrides,
        themeTokens,
    });
    return applyThemeData(updated);
}
