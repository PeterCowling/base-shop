// apps/cms/src/actions/shops.ts

"use server";

import { authOptions } from "@cms/auth/options";
import {
  diffHistory,
  getShopSettings,
  saveShopSettings,
} from "@platform-core/src/repositories/settings.server";
import {
  getShopById,
  updateShopInRepo,
} from "@platform-core/src/repositories/shop.server";
import type { Locale, Shop, ShopSeoFields, ShopSettings } from "@types";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { shopSchema, type ShopForm } from "./schemas";

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role === "viewer") {
    throw new Error("Forbidden");
  }
}

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

  const patch: Partial<Shop> & { id: string } = {
    id: current.id,
    name: data.name,
    themeId: data.themeId,
    catalogFilters: data.catalogFilters,
    themeTokens: data.themeTokens,
    filterMappings: data.filterMappings,
    priceOverrides: data.priceOverrides,
    localeOverrides: data.localeOverrides,
  };

  const saved = await updateShopInRepo(shop, patch);
  return { shop: saved };
}

export async function getSettings(shop: string) {
  return getShopSettings(shop);
}

const seoSchema = z.object({
  locale: z.string(),
  title: z.string().min(1, "Required"),
  description: z.string().optional().default(""),
  image: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\/\S+$/.test(v), {
      message: "Invalid image URL",
    }),
  canonicalBase: z.string().url().optional(),
  ogUrl: z.string().url().optional(),
  twitterCard: z.string().optional(),
});

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
    twitterCard?: string;
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
