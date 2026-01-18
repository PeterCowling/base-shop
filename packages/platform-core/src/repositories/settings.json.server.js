"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonSettingsRepository = void 0;
exports.getShopSettings = getShopSettings;
exports.saveShopSettings = saveShopSettings;
exports.diffHistory = diffHistory;
require("server-only");
const i18n_1 = require("@acme/i18n");
const types_1 = require("@acme/types");
const zod_1 = require("zod");
const index_1 = require("../shops/index");
const date_utils_1 = require("@acme/date-utils");
const safeFs_1 = require("../utils/safeFs");
const DEFAULT_LANGUAGES = [...i18n_1.LOCALES];
// paths resolved via safeFs helpers
function setPatchValue(patch, key, value) {
    // Assign via a narrowed assertion to avoid "never" on index types
    patch[key] = value;
}
function diffSettings(oldS, newS) {
    const patch = {};
    for (const key of Object.keys(newS)) {
        const a = JSON.stringify(oldS[key]);
        const b = JSON.stringify(newS[key]);
        if (a !== b) {
            setPatchValue(patch, key, newS[key]);
        }
    }
    return patch;
}
async function getShopSettings(shop) {
    shop = (0, index_1.validateShopName)(shop);
    try {
        const buf = (await (0, safeFs_1.readFromShop)(shop, "settings.json", "utf8"));
        const parsed = types_1.shopSettingsSchema
            .deepPartial()
            .safeParse(JSON.parse(buf));
        if (parsed.success) {
            const data = parsed.data;
            return {
                freezeTranslations: false,
                ...(data.analytics ? { analytics: data.analytics } : {}),
                ...(data.leadCapture ? { leadCapture: data.leadCapture } : {}),
                currency: data.currency ?? "EUR",
                taxRegion: data.taxRegion ?? "",
                ...data,
                languages: data.languages ?? DEFAULT_LANGUAGES,
                depositService: {
                    enabled: false,
                    intervalMinutes: 60,
                    ...(data.depositService ?? {}),
                },
                reverseLogisticsService: {
                    enabled: false,
                    intervalMinutes: 60,
                    ...(data.reverseLogisticsService ?? {}),
                },
                returnService: {
                    upsEnabled: false,
                    bagEnabled: false,
                    homePickupEnabled: false,
                    ...(data.returnService ?? {}),
                },
                premierDelivery: data.premierDelivery,
                stockAlert: {
                    recipients: [],
                    ...(data.stockAlert ?? {}),
                },
                seo: {
                    ...(data.seo ?? {}),
                    aiCatalog: {
                        enabled: true,
                        fields: ["id", "title", "description", "price", "media"],
                        pageSize: 50,
                        ...((data.seo ?? {}).aiCatalog ?? {}),
                    },
                },
                leadCapture: data.leadCapture ?? { enabled: true },
            };
        }
    }
    catch {
        // ignore
    }
    return {
        languages: DEFAULT_LANGUAGES,
        seo: {
            aiCatalog: {
                enabled: true,
                fields: ["id", "title", "description", "price", "media"],
                pageSize: 50,
            },
        },
        analytics: undefined,
        leadCapture: { enabled: true },
        freezeTranslations: false,
        currency: "EUR",
        taxRegion: "",
        depositService: { enabled: false, intervalMinutes: 60 },
        reverseLogisticsService: { enabled: false, intervalMinutes: 60 },
        returnService: { upsEnabled: false, bagEnabled: false, homePickupEnabled: false },
        premierDelivery: undefined,
        stockAlert: { recipients: [] },
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
        updatedAt: "",
        updatedBy: "",
    };
}
async function saveShopSettings(shop, settings) {
    await (0, safeFs_1.ensureShopDir)(shop);
    const current = await getShopSettings(shop);
    const tmp = `settings.json.${Date.now()}.tmp`;
    await (0, safeFs_1.writeToShop)(shop, tmp, JSON.stringify(settings, null, 2), "utf8");
    await (0, safeFs_1.renameInShop)(shop, tmp, "settings.json");
    const patch = diffSettings(current, settings);
    if (Object.keys(patch).length > 0) {
        const entry = { timestamp: (0, date_utils_1.nowIso)(), diff: patch };
        await (0, safeFs_1.appendToShop)(shop, "settings.history.jsonl", JSON.stringify(entry) + "\n", "utf8");
    }
}
const entrySchema = zod_1.z
    .object({
    timestamp: zod_1.z.string().datetime(),
    diff: types_1.shopSettingsSchema.partial(),
})
    .strict();
async function diffHistory(shop) {
    try {
        const buf = (await (0, safeFs_1.readFromShop)(shop, "settings.history.jsonl", "utf8"));
        return buf
            .trim()
            .split(/\n+/)
            .filter(Boolean)
            .map((line) => {
            try {
                return JSON.parse(line);
            }
            catch {
                return undefined;
            }
        })
            .filter((parsed) => parsed !== undefined)
            .map((parsed) => entrySchema.safeParse(parsed))
            .filter((r) => r.success)
            .map((r) => r.data);
    }
    catch {
        return [];
    }
}
exports.jsonSettingsRepository = {
    getShopSettings,
    saveShopSettings,
    diffHistory,
};
