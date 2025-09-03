import { revalidatePath } from "next/cache";
import type { Locale, ShopSeoFields, ShopSettings } from "@acme/types";
import { authorize, fetchSettings, persistSettings, fetchDiffHistory } from "./helpers";
import { parseSeoForm, parseGenerateSeoForm } from "./validation";

export async function updateSeo(
  shop: string,
  formData: FormData,
): Promise<{
  settings?: unknown;
  errors?: Record<string, string[]>;
  warnings?: string[];
}> {
  await authorize();
  const { data, errors } = parseSeoForm(formData);
  if (!data) {
    console.error(`[updateSeo] validation failed for shop ${shop}`, errors);
    return { errors };
  }

  const { locale, title, description, image, alt, canonicalBase, ogUrl, twitterCard } = data;

  const warnings: string[] = [];
  if (title.length > 70) warnings.push("Title exceeds 70 characters");
  if (description.length > 160) warnings.push("Description exceeds 160 characters");

  const current = await fetchSettings(shop);
  const seo = { ...(current.seo ?? {}) } as Record<Locale, ShopSeoFields>;
  const existing = seo[locale] ?? {};
  seo[locale] = {
    ...existing,
    title,
    description,
    ...(image ? { image } : {}),
    ...(alt ? { alt } : {}),
    ...(canonicalBase ? { canonicalBase } : {}),
    ...(ogUrl
      ? { openGraph: { ...(existing.openGraph ?? {}), url: ogUrl } }
      : {}),
    ...(twitterCard
      ? { twitter: { ...(existing.twitter ?? {}), card: twitterCard } }
      : {}),
  };
  const updated: ShopSettings = {
    ...current,
    seo,
  };
  try {
    await persistSettings(shop, updated);
  } catch (err) {
    console.error(`[updateSeo] failed to persist settings for shop ${shop}`, err);
    return { errors: { _global: ["Failed to persist settings"] } };
  }

  revalidatePath(`/cms/shop/${shop}/settings/seo`);

  return { settings: updated, warnings };
}

export async function generateSeo(
  shop: string,
  formData: FormData,
): Promise<{
  generated?: { title: string; description: string; image: string };
  errors?: Record<string, string[]>;
}> {
  await authorize();
  const { data, errors } = parseGenerateSeoForm(formData);
  if (!data) {
    return { errors };
  }

  const { id, locale, title, description } = data;
  const { generateMeta } = await import("@acme/lib");

  const result = await generateMeta({ id, title, description });
  const current = await fetchSettings(shop);
  const seo = { ...(current.seo ?? {}) } as Record<Locale, ShopSeoFields>;
  seo[locale] = {
    ...(seo[locale] ?? {}),
    title: result.title,
    description: result.description,
    image: result.image,
    openGraph: { ...(seo[locale]?.openGraph ?? {}), image: result.image },
  };
  const updated: ShopSettings = { ...current, seo };
  await persistSettings(shop, updated);

  return { generated: result };
}

interface DiffEntry {
  timestamp: string;
  diff: Partial<ShopSettings>;
}

export async function revertSeo(shop: string, timestamp: string) {
  await authorize();
  const history = (await fetchDiffHistory(shop)) as DiffEntry[];
  const sorted = history.sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const idx = sorted.findIndex((e) => e.timestamp === timestamp);
  if (idx === -1) throw new Error("Version not found");
  let state: ShopSettings = {
    languages: [] as Locale[],
    seo: {},
    luxuryFeatures: {
      premierDelivery: false,
      blog: false,
      contentMerchandising: false,
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      strictReturnConditions: false,
      trackingDashboard: false,
    },
    freezeTranslations: false,
    updatedAt: "",
    updatedBy: "",
  };
  for (let i = 0; i < idx; i++) {
    state = { ...state, ...sorted[i].diff } as ShopSettings;
  }
  await persistSettings(shop, state);
  return state;
}
