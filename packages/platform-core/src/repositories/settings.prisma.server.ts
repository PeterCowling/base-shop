import "server-only";

import type {
  Settings,
  SettingsDiffEntry,
} from "./settings.json.server";
import { jsonSettingsRepository } from "./settings.json.server";

// TODO: replace with real Prisma implementation
export async function getShopSettings(shop: string): Promise<Settings> {
  return jsonSettingsRepository.getShopSettings(shop);
}

export async function saveShopSettings(
  shop: string,
  settings: Settings,
): Promise<void> {
  await jsonSettingsRepository.saveShopSettings(shop, settings);
}

export async function diffHistory(
  shop: string,
): Promise<SettingsDiffEntry[]> {
  return jsonSettingsRepository.diffHistory(shop);
}

export const prismaSettingsRepository = {
  getShopSettings,
  saveShopSettings,
  diffHistory,
};

