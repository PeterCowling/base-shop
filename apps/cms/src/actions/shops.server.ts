// apps/cms/src/actions/shops.ts

"use server";

import {
  diffHistory,
  getShopSettings,
  saveShopSettings,
} from "@platform-core/src/repositories/settings.server";
import {
  getShopById,
  updateShopInRepo,
} from "@platform-core/src/repositories/shop.server";
import { syncTheme, loadTokens } from "@platform-core/src/createShop";
import {
  localeSchema,
  type Locale,
  type Shop,
  type ShopSeoFields,
  type ShopSettings,
} from "@acme/types";
import { z } from "zod";
import { shopSchema, type ShopForm } from "./schemas";
import { ensureAuthorized } from "./common/auth";

export async function updateShop(
  shop: string,
  formData: FormData
): Promise<{ shop?: Shop; errors?: Record<string, string[]> }> {
  await ensureAuthorized();

  const id = String(formData.get("id"));
  const current = await getShopById<Shop>(shop);
  if (current.id !== id) throw new Error(`Shop ${id} not found in ${shop}`);

  const parsed = shopSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>
    )
  );
  if (!parsed.success) {
    console.error(
      `[updateShop] validation failed for shop ${shop}`,
      parsed.error
    );
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data: ShopForm = parsed.data;

  const overrides = data.themeOverrides as Record<string, string>;
  const themeDefaults =
    current.themeId !== data.themeId
      ? syncTheme(shop, data.themeId)
      : loadTokens(data.themeId);
  const themeTokens = { ...themeDefaults, ...overrides };

  const patch: Partial<Shop> & { id: string } = {
    id: current.id,
    name: data.name,
    themeId: data.themeId,
    catalogFilters: data.catalogFilters,
    themeDefaults,
    themeOverrides: overrides,
    themeTokens,
    filterMappings: data.filterMappings as Record<string, string>,
    priceOverrides: data.priceOverrides as Partial<Record<Locale, number>>,
    localeOverrides: data.localeOverrides as Record<string, Locale>,
  };

  const saved = await updateShopInRepo(shop, patch);
  return { shop: saved };
}

export async function getSettings(shop: string) {
  return getShopSettings(shop);
}

const seoSchema = z
  .object({
    locale: localeSchema,
    title: z.string().min(1, "Required"),
    description: z.string().optional().default(""),
    image: z.string().url().optional(),
    canonicalBase: z.string().url().optional(),
    ogUrl: z.string().url().optional(),
    twitterCard: z
      .enum(["summary", "summary_large_image", "app", "player"])
      .optional(),
  })
  .strict();

export async function updateSeo(
  shop: string,
  formData: FormData
): Promise<{
  settings?: unknown;
  errors?: Record<string, string[]>;
  warnings?: string[];
}> {
  await ensureAuthorized();

  const parsed = seoSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>
    )
  );
  if (!parsed.success) {
    console.error(
      `[updateSeo] validation failed for shop ${shop}`,
      parsed.error
    );
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const {
    locale,
    title,
    description,
    image,
    canonicalBase,
    ogUrl,
    twitterCard,
  } = parsed.data as {
    locale: Locale;
    title: string;
    description: string;
    image?: string;
    canonicalBase?: string;
    ogUrl?: string;
    twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  };

  const warnings: string[] = [];
  if (title.length > 70) warnings.push("Title exceeds 70 characters");
  if (description.length > 160)
    warnings.push("Description exceeds 160 characters");

  const current = await getShopSettings(shop);
  const seo = { ...(current.seo ?? {}) } as Record<Locale, ShopSeoFields>;
  seo[locale] = {
    title,
    description,
    image,
    canonicalBase,
    openGraph: ogUrl ? { url: ogUrl } : undefined,
    twitter: twitterCard ? { card: twitterCard } : undefined,
  };
  const updated: ShopSettings = {
    ...current,
    seo,
  };
  await saveShopSettings(shop, updated);

  return { settings: updated, warnings };
}

const generateSchema = z
  .object({
    id: z.string().min(1),
    locale: localeSchema,
    title: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export async function generateSeo(
  shop: string,
  formData: FormData,
): Promise<{
  generated?: { title: string; description: string; image: string };
  errors?: Record<string, string[]>;
}> {
  await ensureAuthorized();

  const parsed = generateSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>,
    ),
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { id, locale, title, description } = parsed.data;
  const { generateMeta } = await import(
    /* @vite-ignore */ "../../../../scripts/generate-meta.ts"
  );

  const result = await generateMeta({ id, title, description });
  const current = await getShopSettings(shop);
  const seo = { ...(current.seo ?? {}) } as Record<Locale, ShopSeoFields>;
  seo[locale] = {
    ...(seo[locale] ?? {}),
    title: result.title,
    description: result.description,
    image: result.image,
    openGraph: { ...(seo[locale]?.openGraph ?? {}), image: result.image },
  };
  const updated: ShopSettings = { ...current, seo };
  await saveShopSettings(shop, updated);

  return { generated: result };
}

export async function revertSeo(shop: string, timestamp: string) {
  await ensureAuthorized();
  const history = await diffHistory(shop);
  const sorted = history.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const idx = sorted.findIndex((e) => e.timestamp === timestamp);
  if (idx === -1) throw new Error("Version not found");
  let state: ShopSettings = {
    languages: [],
    seo: {},
    freezeTranslations: false,
    updatedAt: "",
    updatedBy: "",
  };
  for (let i = 0; i < idx; i++) {
    state = { ...state, ...sorted[i].diff } as ShopSettings;
  }
  await saveShopSettings(shop, state);
  return state;
}

export async function setFreezeTranslations(shop: string, freeze: boolean) {
  await ensureAuthorized();
  const current = await getShopSettings(shop);
  const updated: ShopSettings = { ...current, freezeTranslations: freeze };
  await saveShopSettings(shop, updated);
  return updated;
}

const currencyTaxSchema = z
  .object({
    currency: z.string().length(3, "Required"),
    taxRegion: z.string().min(1, "Required"),
  })
  .strict();

export async function updateCurrencyAndTax(
  shop: string,
  formData: FormData
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await ensureAuthorized();
  const parsed = currencyTaxSchema.safeParse(
    Object.fromEntries(formData as unknown as Iterable<[string, FormDataEntryValue]>)
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const current = await getShopSettings(shop);
  const updated: ShopSettings = {
    ...current,
    currency: parsed.data.currency,
    taxRegion: parsed.data.taxRegion,
  };
  await saveShopSettings(shop, updated);
  return { settings: updated };
}

const depositSchema = z
  .object({
    enabled: z.preprocess((v) => v === "on", z.boolean()),
    interval: z.coerce.number().int().min(1, "Must be at least 1"),
  })
  .strict();

export async function updateDepositService(
  shop: string,
  formData: FormData
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await ensureAuthorized();
  const parsed = depositSchema.safeParse(
    Object.fromEntries(formData as unknown as Iterable<[string, FormDataEntryValue]>)
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const current = await getShopSettings(shop);
  const updated: ShopSettings = {
    ...current,
    depositService: {
      enabled: parsed.data.enabled,
      interval: parsed.data.interval,
    },
  };
  await saveShopSettings(shop, updated);
  return { settings: updated };
}
