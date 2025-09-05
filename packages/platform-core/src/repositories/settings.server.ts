// packages/platform-core/repositories/settings.server.ts
import "server-only";

import { LOCALES } from "@acme/i18n";
import {
  shopSettingsSchema,
  type Locale,
  type ShopSettings,
} from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { z } from "zod";
import { validateShopName } from "../shops/index";
import { DATA_ROOT } from "../dataRoot";
import { nowIso } from "@acme/date-utils";
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

function setPatchValue<T extends object, K extends keyof T>(
  patch: Partial<T>,
  key: K,
  value: T[K]
): void {
  patch[key] = value;
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
      setPatchValue(patch, key, newS[key]);
    }
  }
  return patch;
}

export async function getShopSettings(shop: string): Promise<ShopSettings> {
  shop = validateShopName(shop);
  try {
    const buf = await fs.readFile(settingsPath(shop), "utf8");
    const parsed = shopSettingsSchema
      .deepPartial()
      .safeParse(JSON.parse(buf));
    if (parsed.success) {
      const data = parsed.data as Partial<ShopSettings>;
      return {
        freezeTranslations: false,
        ...(data.analytics ? { analytics: data.analytics } : {}),
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
      } as ShopSettings;
    }
  } catch {
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
  } as ShopSettings;
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

const entrySchema = z
  .object({
    timestamp: z.string().datetime(),
    diff: shopSettingsSchema.partial(),
  })
  .strict();

export async function diffHistory(shop: string): Promise<SettingsDiffEntry[]> {
  try {
    const buf = await fs.readFile(historyPath(shop), "utf8");
      return buf
        .trim()
        .split(/\n+/)
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return undefined;
          }
        })
        .filter((parsed): parsed is unknown => parsed !== undefined)
        .map((parsed) => entrySchema.safeParse(parsed))
        .filter((r) => r.success)
        .map((r) => (r as z.SafeParseSuccess<SettingsDiffEntry>).data);
  } catch {
    return [];
  }
}
