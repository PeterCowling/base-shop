"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaSettingsRepository = void 0;
exports.getShopSettings = getShopSettings;
exports.saveShopSettings = saveShopSettings;
exports.diffHistory = diffHistory;
require("server-only");
const date_utils_1 = require("@acme/date-utils");
const types_1 = require("@acme/types");
const db_1 = require("../db");
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
async function getShopSettings(shop) {
    const rec = await db_1.prisma.setting.findUnique({ where: { shop } });
    if (!rec) {
        throw new Error(`Settings for shop ${shop} not found`);
    }
    const parsed = types_1.shopSettingsSchema.parse(rec.data);
    return parsed;
}
async function saveShopSettings(shop, settings) {
    const existing = await db_1.prisma.setting.findUnique({ where: { shop } });
    const previous = existing
        ? types_1.shopSettingsSchema.parse(existing.data)
        : undefined;
    await db_1.prisma.setting.upsert({
        where: { shop },
        create: { shop, data: settings },
        update: { data: settings },
    });
    const patch = previous ? diffSettings(previous, settings) : settings;
    if (Object.keys(patch).length > 0) {
        await db_1.prisma.settingDiff.create({
            data: { shop, timestamp: (0, date_utils_1.nowIso)(), diff: patch },
        });
    }
}
async function diffHistory(shop) {
    const rows = await db_1.prisma.settingDiff.findMany({
        where: { shop },
        orderBy: { timestamp: "asc" },
    });
    return rows.map((r) => ({
        timestamp: r.timestamp,
        diff: types_1.shopSettingsSchema.partial().parse(r.diff),
    }));
}
exports.prismaSettingsRepository = {
    getShopSettings,
    saveShopSettings,
    diffHistory,
};
