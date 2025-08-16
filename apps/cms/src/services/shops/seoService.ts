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
  seo[locale] = {
    title,
    description,
    image,
    alt,
    canonicalBase,
    openGraph: ogUrl ? { url: ogUrl } : undefined,
    twitter: twitterCard ? { card: twitterCard } : undefined,
  };
  const updated: ShopSettings = {
    ...current,
    seo,
  };
  await persistSettings(shop, updated);

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
  const { generateMeta } = await import("@acme/lib/generateMeta");

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

export async function revertSeo(shop: string, timestamp: string) {
  await authorize();
  const history = await fetchDiffHistory(shop);
  const sorted = history.sort((a: any, b: any) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const idx = sorted.findIndex((e: any) => e.timestamp === timestamp);
  if (idx === -1) throw new Error("Version not found");
  let state: ShopSettings = {
    languages: [] as Locale[],
    seo: {},
    luxuryFeatures: {
      contentMerchandising: false,
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      returns: false,
      strictReturnConditions: false,
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
