import { revalidatePath } from "next/cache";
import type { Locale, ShopSeoFields, ShopSettings } from "@acme/types";
import { authorize, fetchSettings, persistSettings, fetchDiffHistory } from "./helpers";
import { recordMetric } from "@platform-core/utils";
import { incrementOperationalError } from "@platform-core/shops/health";
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

  const { locale, title, description, image, alt, canonicalBase, ogUrl, twitterCard, brand, offers, aggregateRating, structuredData } = data;

  const warnings: string[] = [];
  if (title.length > 70) warnings.push("Title exceeds 70 characters"); // i18n-exempt: validation hint; no translation keys defined yet
  if (description.length > 160) warnings.push("Description exceeds 160 characters"); // i18n-exempt: validation hint; no translation keys defined yet
  const fieldErrors: Record<string, string[]> = {};
  if (!title.trim()) fieldErrors.title = ["Title is required"];
  if (!description.trim()) fieldErrors.description = ["Description is required"];
  if (Object.keys(fieldErrors).length > 0) {
    return { errors: fieldErrors, warnings };
  }

  const current = await fetchSettings(shop);
  const seo = { ...(current.seo ?? {}) } as Record<Locale, ShopSeoFields>;
  const existing = seo[locale] ?? {};
  // Build structured data JSON from UI fields if provided
  let sd = structuredData;
  if (!sd && (brand || offers || aggregateRating)) {
    const sdObj: Record<string, unknown> = {};
    if (brand) sdObj.brand = brand;
    if (offers) {
      try {
        sdObj.offers = JSON.parse(offers);
      } catch {
        sdObj.offers = offers;
      }
    }
    if (aggregateRating) {
      try {
        sdObj.aggregateRating = JSON.parse(aggregateRating);
      } catch {
        sdObj.aggregateRating = aggregateRating;
      }
    }
    sd = JSON.stringify(sdObj);
  }
  if (sd) {
    try {
      const parsed = JSON.parse(sd);
      if (!parsed || typeof parsed !== "object") {
        return { errors: { structuredData: ["Structured data must be a JSON object"] } };
      }
      const context = (parsed as Record<string, unknown>)["@context"];
      const type = (parsed as Record<string, unknown>)["@type"];
      if (!context || !type) {
        return { errors: { structuredData: ["Structured data must include @context and @type"] } };
      }
      const typeStr = Array.isArray(type) ? (type as string[])[0] : String(type);
      const allowedTypes = new Set(["Product", "WebPage"]);
      if (typeStr && !allowedTypes.has(typeStr)) {
        return { errors: { structuredData: ["@type must be Product or WebPage"] } };
      }
    } catch {
      return { errors: { structuredData: ["Structured data must be valid JSON"] } };
    }
  }

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
    ...(sd ? { structuredData: sd } : {}),
  };
  const updated: ShopSettings = {
    ...current,
    seo,
  };
  try {
    await persistSettings(shop, updated);
  } catch (err) {
    console.error(`[updateSeo] failed to persist settings for shop ${shop}`, err);
    incrementOperationalError(shop);
    recordMetric("cms_settings_save_total", {
      shopId: shop,
      service: "cms",
      status: "failure",
    });
    return { errors: { _global: ["Failed to persist settings"] } }; // i18n-exempt: server error surfaced to UI; tests rely on literal
  }

  try {
    revalidatePath(`/cms/shop/${shop}/settings/seo`);
  } catch (err) {
    // In tests or non-Next runtimes the static generation store may be
    // missing, which causes `revalidatePath` to throw. Failing to
    // revalidate is non-critical here so swallow the error.
    console.warn(
      `[updateSeo] failed to revalidate path for shop ${shop}`,
      err,
    );
  }

  recordMetric("cms_settings_save_total", {
    shopId: shop,
    service: "cms",
    status: "success",
  });
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
  const sorted = [...history].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const idx = sorted.findIndex((e) => e.timestamp === timestamp);
  if (idx === -1) throw new Error("Version not found"); // i18n-exempt: developer exception message
  const base = await fetchSettings(shop);
  let state: ShopSettings = { ...base };
  for (let i = 0; i <= idx; i++) {
    state = { ...state, ...sorted[i].diff } as ShopSettings;
  }
  await persistSettings(shop, state);
  return state;
}
