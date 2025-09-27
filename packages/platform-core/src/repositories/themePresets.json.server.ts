import "server-only";

import { ensureShopDir, readFromShop, writeToShop } from "../utils/safeFs";

// preset path resolved via safeFs helpers

async function readPresets(shop: string) {
  try {
    const buf = (await readFromShop(shop, "theme-presets.json", "utf8")) as string;
    return JSON.parse(buf) as Record<string, Record<string, string>>;
  } catch {
    return {} as Record<string, Record<string, string>>;
  }
}

export async function getThemePresets(
  shop: string,
): Promise<Record<string, Record<string, string>>> {
  return readPresets(shop);
}

export async function saveThemePreset(
  shop: string,
  name: string,
  tokens: Record<string, string>,
): Promise<void> {
  const presets = await readPresets(shop);
  presets[name] = tokens;
  await ensureShopDir(shop);
  await writeToShop(shop, "theme-presets.json", JSON.stringify(presets, null, 2), "utf8");
}

export async function deleteThemePreset(
  shop: string,
  name: string,
): Promise<void> {
  const presets = await readPresets(shop);
  delete presets[name];
  await ensureShopDir(shop);
  await writeToShop(shop, "theme-presets.json", JSON.stringify(presets, null, 2), "utf8");
}

export const jsonThemePresetRepository = {
  getThemePresets,
  saveThemePreset,
  deleteThemePreset,
};
