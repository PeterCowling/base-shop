import type { Locale } from "@i18n/locales";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import type { ShopSettings } from "@types";
import type { NextSeoProps } from "next-seo";

interface ExtendedSeoProps extends Partial<NextSeoProps> {
  canonicalBase?: string;
}

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
  const settings: ShopSettings = await getShopSettings(shop);
  const shopSeo = (settings.seo ?? {}) as Record<string, ExtendedSeoProps>;
  const base: ExtendedSeoProps = shopSeo[locale] ?? {};
  const canonicalBase = base.canonicalBase ?? "";

  return {
    title: pageSeo.title ?? base.title ?? fallback.title,
    description:
      pageSeo.description ?? base.description ?? fallback.description,
    canonical:
      pageSeo.canonical ??
      base.canonical ??
      (canonicalBase ? `${canonicalBase}/${locale}` : fallback.canonical),
    openGraph: {
      ...(fallback.openGraph ?? {}),
      ...(base.openGraph ?? {}),
      ...(pageSeo.openGraph ?? {}),
      url:
        pageSeo.openGraph?.url ??
        base.openGraph?.url ??
        (canonicalBase ? `${canonicalBase}/${locale}` : undefined),
    },
    twitter: {
      ...(fallback.twitter ?? {}),
      ...(base.twitter ?? {}),
      ...(pageSeo.twitter ?? {}),
    },
  };
}
