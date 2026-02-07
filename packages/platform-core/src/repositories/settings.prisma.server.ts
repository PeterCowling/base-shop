import "server-only";

import { nowIso } from "@acme/date-utils";
import { shopSettingsSchema } from "@acme/types";

import { prisma } from "../db";

import type {
  Settings,
  SettingsDiffEntry,
} from "./settings.json.server";

function setPatchValue<T extends object, K extends keyof T>(
  patch: Partial<T>,
  key: K,
  value: T[K],
): void {
  (patch as T)[key] = value;
}

function diffSettings(oldS: Settings, newS: Settings): Partial<Settings> {
  const patch: Partial<Settings> = {};
  for (const key of Object.keys(newS) as (keyof Settings)[]) {
    const a = JSON.stringify(oldS[key]);
    const b = JSON.stringify(newS[key]);
    if (a !== b) {
      setPatchValue(patch, key, newS[key]);
    }
  }
  return patch;
}

export async function getShopSettings(shop: string): Promise<Settings> {
  const rec = await prisma.setting.findUnique({ where: { shop } });
  if (!rec) {
    throw new Error(`Settings for shop ${shop} not found`);
  }
  const parsed = shopSettingsSchema.parse(rec.data);
  return parsed as Settings;
}

export async function saveShopSettings(
  shop: string,
  settings: Settings,
): Promise<void> {
  const existing = await prisma.setting.findUnique({ where: { shop } });
  const previous = existing
    ? (shopSettingsSchema.parse(existing.data) as Settings)
    : undefined;

  await prisma.setting.upsert({
    where: { shop },
    create: { shop, data: settings },
    update: { data: settings },
  });

  const patch = previous ? diffSettings(previous, settings) : settings;
  if (Object.keys(patch).length > 0) {
    await prisma.settingDiff.create({
      data: { shop, timestamp: nowIso(), diff: patch },
    });
  }
}

export async function diffHistory(
  shop: string,
): Promise<SettingsDiffEntry[]> {
  const rows = await prisma.settingDiff.findMany({
    where: { shop },
    orderBy: { timestamp: "asc" },
  });
  return rows.map((r: { timestamp: string; diff: unknown }) => ({
    timestamp: r.timestamp,
    diff: shopSettingsSchema.partial().parse(r.diff),
  }));
}

export const prismaSettingsRepository = {
  getShopSettings,
  saveShopSettings,
  diffHistory,
};
