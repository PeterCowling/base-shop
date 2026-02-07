import "server-only";

import { z } from "zod";

import { nowIso } from "@acme/date-utils";
import { LOCALES } from "@acme/i18n/locales";
import {
  type Locale,
  type ShopSettings,
  shopSettingsSchema,
} from "@acme/types";

import { validateShopName } from "../shops/index";
import {
  appendToShop,
  ensureShopDir,
  readFromShop,
  renameInShop,
  writeToShop,
} from "../utils/safeFs";

const DEFAULT_LANGUAGES: Locale[] = [...LOCALES];

export type Settings = ShopSettings;

// paths resolved via safeFs helpers

export function getDefaultShopSettings(): Settings {
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
    leadCapture: { enabled: true },
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
  } as Settings;
}

function setPatchValue<T extends object, K extends keyof T>(
  patch: Partial<T>,
  key: K,
  value: T[K],
): void {
  // Assign via a narrowed assertion to avoid "never" on index types
  (patch as T)[key] = value;
}

function diffSettings(
  oldS: Settings,
  newS: Settings,
): Partial<Settings> {
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
  shop = validateShopName(shop);
  try {
    const buf = (await readFromShop(shop, "settings.json", "utf8")) as string;
    const parsed = shopSettingsSchema
      .deepPartial()
      .safeParse(JSON.parse(buf));
    if (parsed.success) {
      const data = parsed.data as Partial<Settings>;
      return {
        freezeTranslations: false,
        ...(data.analytics ? { analytics: data.analytics } : {}),
        ...(data.leadCapture ? { leadCapture: data.leadCapture } : {}),
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
        leadCapture: data.leadCapture ?? { enabled: true },
      } as Settings;
    }
  } catch {
    // ignore
  }
  return getDefaultShopSettings();
}

export async function saveShopSettings(
  shop: string,
  settings: Settings,
): Promise<void> {
  await ensureShopDir(shop);
  const current = await getShopSettings(shop);
  const tmp = `settings.json.${Date.now()}.tmp`;
  await writeToShop(shop, tmp, JSON.stringify(settings, null, 2), "utf8");
  await renameInShop(shop, tmp, "settings.json");

  const patch = diffSettings(current, settings);
  if (Object.keys(patch).length > 0) {
    const entry = { timestamp: nowIso(), diff: patch };
    await appendToShop(shop, "settings.history.jsonl", JSON.stringify(entry) + "\n", "utf8");
  }
}

export interface SettingsDiffEntry {
  timestamp: string;
  diff: Partial<Settings>;
}

const entrySchema = z
  .object({
    timestamp: z.string().datetime(),
    diff: shopSettingsSchema.partial(),
  })
  .strict();

export async function diffHistory(shop: string): Promise<SettingsDiffEntry[]> {
  try {
    const buf = (await readFromShop(shop, "settings.history.jsonl", "utf8")) as string;
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

export const jsonSettingsRepository = {
  getShopSettings,
  saveShopSettings,
  diffHistory,
};
