import type { Locale } from "@i18n/locales";
import { getShopSettings } from "@platform-core/repositories/shops";
import type { NextSeoProps } from "next-seo";

const fallback: NextSeoProps = {
  title: "",
  description: "",
  canonical: "",
  openGraph: {},
  twitter: {},
};

export async function getSeo(
  locale: Locale,
  pageSeo: Partial<NextSeoProps> = {}
): Promise<NextSeoProps> {
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || "default";
  const settings = await getShopSettings(shop);
  const shopSeo: Record<string, Partial<NextSeoProps>> = (settings as any)
    .seo ?? {};
  const base = shopSeo[locale] ?? {};

  return {
    title: pageSeo.title ?? base.title ?? fallback.title,
    description:
      pageSeo.description ?? base.description ?? fallback.description,
    canonical: pageSeo.canonical ?? base.canonical ?? fallback.canonical,
    openGraph: {
      ...(fallback.openGraph ?? {}),
      ...(base.openGraph ?? {}),
      ...(pageSeo.openGraph ?? {}),
    },
    twitter: {
      ...(fallback.twitter ?? {}),
      ...(base.twitter ?? {}),
      ...(pageSeo.twitter ?? {}),
    },
  };
}
