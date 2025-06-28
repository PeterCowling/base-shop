// apps/cms/src/actions/shops.ts

"use server";

import { authOptions } from "@cms/auth/options";
import {
  getShopById,
  updateShopInRepo,
} from "@platform-core/repositories/json";
import {
  getShopSettings,
  saveShopSettings,
} from "@platform-core/repositories/shops";
import type { Locale, Shop, ShopSeoFields, ShopSettings } from "@types";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { shopSchema, type ShopForm } from "./schemas";

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "viewer") {
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

  const parsed = shopSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
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

  const parsed = seoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { locale, title, description, image } = parsed.data as {
    locale: Locale;
    title: string;
    description: string;
    image?: string;
  };

  const warnings: string[] = [];
  if (title.length > 70) warnings.push("Title exceeds 70 characters");
  if (description.length > 160)
    warnings.push("Description exceeds 160 characters");

  const current = await getShopSettings(shop);
  const seo = { ...(current.seo ?? {}) } as Record<Locale, ShopSeoFields>;
  seo[locale] = { title, description, image };
  const updated: ShopSettings = { ...current, seo };
  await saveShopSettings(shop, updated);

  return { settings: updated, warnings };
}
