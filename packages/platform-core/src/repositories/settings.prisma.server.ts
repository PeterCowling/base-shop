import "server-only";

import { nowIso } from "@acme/date-utils";
import { shopSettingsSchema } from "@acme/types";

import { prisma } from "../db";
import {
  jsonSettingsRepository,
  type Settings,
  type SettingsDiffEntry,
} from "./settings.json.server";

function diffSettings(oldS: Settings, newS: Settings): Partial<Settings> {
  const patch: Partial<Settings> = {};
  for (const key of Object.keys(newS) as (keyof Settings)[]) {
    const a = JSON.stringify(oldS[key]);
    const b = JSON.stringify(newS[key]);
    if (a !== b) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - dynamic key assignment
      patch[key] = newS[key];
    }
  }
  return patch;
}

export async function getShopSettings(shop: string): Promise<Settings> {
  try {
    const rec = await prisma.setting.findUnique({ where: { shop } });
    if (!rec) {
      return jsonSettingsRepository.getShopSettings(shop);
    }
    const parsed = shopSettingsSchema.parse(rec.data);
    return parsed as Settings;
  } catch {
    return jsonSettingsRepository.getShopSettings(shop);
  }
}

export async function saveShopSettings(
  shop: string,
  settings: Settings,
): Promise<void> {
  try {
    const current = await getShopSettings(shop);
    await prisma.setting.upsert({
      where: { shop },
      create: { shop, data: settings },
      update: { data: settings },
    });
    const patch = diffSettings(current, settings);
    if (Object.keys(patch).length > 0) {
      await prisma.settingDiff.create({
        data: { shop, timestamp: nowIso(), diff: patch },
      });
    }
  } catch {
    await jsonSettingsRepository.saveShopSettings(shop, settings);
  }
}

export async function diffHistory(
  shop: string,
): Promise<SettingsDiffEntry[]> {
  try {
    const rows = await prisma.settingDiff.findMany({
      where: { shop },
      orderBy: { timestamp: "asc" },
    });
    return rows.map((r: { timestamp: string; diff: unknown }) => ({
      timestamp: r.timestamp,
      diff: r.diff as any,
    }));
  } catch {
    return jsonSettingsRepository.diffHistory(shop);
  }
}

export const prismaSettingsRepository = {
  getShopSettings,
  saveShopSettings,
  diffHistory,
};
