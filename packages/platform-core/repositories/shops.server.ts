// packages/platform-core/repositories/shops.server.ts
import "server-only";

import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { ShopSettings } from "../../types/src";
import { LOCALES, type Locale } from "../../types/src";
import { validateShopName } from "../shops";

function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

const DATA_ROOT = resolveDataRoot();
const DEFAULT_LANGUAGES: Locale[] = [...LOCALES];

function settingsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "settings.json");
}

function historyPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "settings.history.jsonl");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

function diffSettings(
  oldS: ShopSettings,
  newS: ShopSettings
): Partial<ShopSettings> {
  const patch: Partial<ShopSettings> = {};
  for (const key of Object.keys(newS) as (keyof ShopSettings)[]) {
    const a = JSON.stringify(oldS[key]);
    const b = JSON.stringify(newS[key]);
    if (a !== b) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (patch as any)[key] = newS[key];
    }
  }
  return patch;
}

export async function getShopSettings(shop: string): Promise<ShopSettings> {
  try {
    const buf = await fs.readFile(settingsPath(shop), "utf8");
    const parsed = JSON.parse(buf) as ShopSettings;
    if (Array.isArray(parsed.languages))
      return {
        freezeTranslations: false,
        ...parsed,
      };
  } catch {
    // ignore
  }
  return {
    languages: DEFAULT_LANGUAGES,
    seo: {},
    freezeTranslations: false,
    updatedAt: "",
    updatedBy: "",
  };
}

export async function saveShopSettings(
  shop: string,
  settings: ShopSettings
): Promise<void> {
  await ensureDir(shop);
  const current = await getShopSettings(shop);
  const tmp = `${settingsPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(settings, null, 2), "utf8");
  await fs.rename(tmp, settingsPath(shop));

  const patch = diffSettings(current, settings);
  if (Object.keys(patch).length > 0) {
    const entry = { timestamp: new Date().toISOString(), diff: patch };
    await fs.appendFile(
      historyPath(shop),
      JSON.stringify(entry) + "\n",
      "utf8"
    );
  }
}

export interface SettingsDiffEntry {
  timestamp: string;
  diff: Partial<ShopSettings>;
}

export async function diffHistory(shop: string): Promise<SettingsDiffEntry[]> {
  try {
    const buf = await fs.readFile(historyPath(shop), "utf8");
    return buf
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SettingsDiffEntry);
  } catch {
    return [];
  }
}
