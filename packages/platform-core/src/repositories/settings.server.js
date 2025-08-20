// packages/platform-core/repositories/settings.server.ts
import "server-only";
import { LOCALES } from "@acme/i18n/locales";
import { shopSettingsSchema, } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { validateShopName } from "../shops/index.js";
import { DATA_ROOT } from "../dataRoot.js";
import { nowIso } from "@acme/date-utils";
const DEFAULT_LANGUAGES = [...LOCALES];
function settingsPath(shop) {
    shop = validateShopName(shop);
    return path.join(DATA_ROOT, shop, "settings.json");
}
function historyPath(shop) {
    shop = validateShopName(shop);
    return path.join(DATA_ROOT, shop, "settings.history.jsonl");
}
async function ensureDir(shop) {
    shop = validateShopName(shop);
    await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}
function setPatchValue(patch, key, value) {
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
export async function getShopSettings(shop) {
    try {
        const buf = await fs.readFile(settingsPath(shop), "utf8");
        const parsed = shopSettingsSchema.safeParse(JSON.parse(buf));
        if (parsed.success) {
            return {
                freezeTranslations: false,
                ...(parsed.data.analytics ? { analytics: parsed.data.analytics } : {}),
                currency: parsed.data.currency ?? "EUR",
                taxRegion: parsed.data.taxRegion ?? "",
                ...parsed.data,
                depositService: {
                    enabled: false,
                    intervalMinutes: 60,
                    ...(parsed.data.depositService ?? {}),
                },
                reverseLogisticsService: {
                    enabled: false,
                    intervalMinutes: 60,
                    ...(parsed.data.reverseLogisticsService ?? {}),
                },
                returnService: {
                    upsEnabled: false,
                    bagEnabled: false,
                    homePickupEnabled: false,
                    ...(parsed.data.returnService ?? {}),
                },
                premierDelivery: parsed.data.premierDelivery,
                stockAlert: {
                    recipients: [],
                    ...(parsed.data.stockAlert ?? {}),
                },
                seo: {
                    ...(parsed.data.seo ?? {}),
                    aiCatalog: {
                        enabled: false,
                        fields: ["id", "title", "description", "price", "media"],
                        pageSize: 50,
                        ...((parsed.data.seo ?? {}).aiCatalog ?? {}),
                    },
                },
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
                enabled: false,
                fields: ["id", "title", "description", "price", "media"],
                pageSize: 50,
            },
        },
        analytics: undefined,
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
export async function saveShopSettings(shop, settings) {
    await ensureDir(shop);
    const current = await getShopSettings(shop);
    const tmp = `${settingsPath(shop)}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(settings, null, 2), "utf8");
    await fs.rename(tmp, settingsPath(shop));
    const patch = diffSettings(current, settings);
    if (Object.keys(patch).length > 0) {
        const entry = { timestamp: nowIso(), diff: patch };
        await fs.appendFile(historyPath(shop), JSON.stringify(entry) + "\n", "utf8");
    }
}
const entrySchema = z
    .object({
    timestamp: z.string().datetime(),
    diff: shopSettingsSchema.partial(),
})
    .strict();
export async function diffHistory(shop) {
    try {
        const buf = await fs.readFile(historyPath(shop), "utf8");
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
