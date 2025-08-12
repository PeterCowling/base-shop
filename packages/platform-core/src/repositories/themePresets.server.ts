import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";

function presetsPath(shop: string) {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "theme-presets.json");
}

async function readPresets(shop: string) {
  try {
    const buf = await fs.readFile(presetsPath(shop), "utf8");
    return JSON.parse(buf) as Record<string, Record<string, string>>;
  } catch {
    return {} as Record<string, Record<string, string>>;
  }
}

export async function getThemePresets(shop: string) {
  return readPresets(shop);
}

export async function saveThemePreset(
  shop: string,
  name: string,
  tokens: Record<string, string>,
) {
  const presets = await readPresets(shop);
  presets[name] = tokens;
  await fs.mkdir(path.dirname(presetsPath(shop)), { recursive: true });
  await fs.writeFile(presetsPath(shop), JSON.stringify(presets, null, 2), "utf8");
}

export async function deleteThemePreset(shop: string, name: string) {
  const presets = await readPresets(shop);
  delete presets[name];
  await fs.mkdir(path.dirname(presetsPath(shop)), { recursive: true });
  await fs.writeFile(presetsPath(shop), JSON.stringify(presets, null, 2), "utf8");
}

