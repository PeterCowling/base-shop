import type { Locale, ShopSeoFields, ShopSettings } from "@acme/types";

import { authorize, fetchSettings, persistSettings } from "./helpers";
import { parseGenerateSeoForm } from "./validation";

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
  const { generateMeta } = await import("@acme/lib/server");

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
  const updated = { ...current, seo } as unknown as ShopSettings;
  await persistSettings(shop, updated);

  return { generated: result };
}
