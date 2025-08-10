// packages/platform-core/repositories/settings.server.ts
import "server-only";

import { LOCALES } from "@i18n/locales";
import { shopSettingsSchema, type Locale, type ShopSettings } from "@types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";
import { nowIso } from "@shared/date";
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
    const parsed = shopSettingsSchema.safeParse(JSON.parse(buf));
    if (parsed.success) {
      return {
        freezeTranslations: false,
        ...(parsed.data.analytics ? { analytics: parsed.data.analytics } : {}),
        currency: parsed.data.currency ?? "EUR",
        taxRegion: parsed.data.taxRegion ?? "",
        ...parsed.data,
      };
    }
  } catch {
    // ignore
  }
  return {
    languages: DEFAULT_LANGUAGES,
    seo: {},
    analytics: undefined,
    freezeTranslations: false,
    currency: "EUR",
    taxRegion: "",
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
    const entry = { timestamp: nowIso(), diff: patch };
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

const entrySchema = z.object({
  timestamp: z.string().datetime(),
  diff: shopSettingsSchema.partial(),
});

export async function diffHistory(shop: string): Promise<SettingsDiffEntry[]> {
  try {
    const buf = await fs.readFile(historyPath(shop), "utf8");
    return buf
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => entrySchema.safeParse(JSON.parse(line)))
      .filter((r) => r.success)
      .map((r) => (r as z.SafeParseSuccess<SettingsDiffEntry>).data);
  } catch {
    return [];
  }
}
