import { LOCALES, type Locale } from "@i18n/locales";
import { getShopSettings } from "@platform-core/repositories/shops.server";
import type { ShopSettings } from "@types";
import type { NextSeoProps } from "next-seo";

interface ExtendedSeoProps extends Partial<NextSeoProps> {
  canonicalBase?: string;
}

interface AlternateLink {
  hrefLang: Locale;
  href: string;
}

const fallback: NextSeoProps = {
  title: "",
  description: "",
  canonical: "",
  openGraph: {},
  twitter: {},
};

export interface SeoResult extends NextSeoProps {
  alternate: AlternateLink[];
}

export async function getSeo(
  locale: Locale,
  pageSeo: Partial<NextSeoProps> = {}
): Promise<SeoResult> {
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || "default";
  const settings: ShopSettings = await getShopSettings(shop);
  const shopSeo = (settings.seo ?? {}) as Record<string, ExtendedSeoProps>;

  const canonicalUrls: Partial<Record<Locale, string>> = {};
  for (const l of LOCALES) {
    const baseSeo = shopSeo[l] ?? {};
    const cb = baseSeo.canonicalBase;
    if (cb) {
      canonicalUrls[l] = `${cb}/${l}`;
    }
  }

  const base = shopSeo[locale] ?? {};
  const canonical =
    pageSeo.canonical ??
    base.canonical ??
    canonicalUrls[locale] ??
    fallback.canonical;

  const openGraphUrl =
    pageSeo.openGraph?.url ?? base.openGraph?.url ?? canonicalUrls[locale];

  const alternate: AlternateLink[] = LOCALES.flatMap((l) => {
    const url = canonicalUrls[l];
    return url ? [{ hrefLang: l, href: url }] : [];
  });

  return {
    title: pageSeo.title ?? base.title ?? fallback.title,
    description:
      pageSeo.description ?? base.description ?? fallback.description,
    canonical,
    openGraph: {
      ...(fallback.openGraph ?? {}),
      ...(base.openGraph ?? {}),
      ...(pageSeo.openGraph ?? {}),
      url: openGraphUrl,
    },
    twitter: {
      ...(fallback.twitter ?? {}),
      ...(base.twitter ?? {}),
      ...(pageSeo.twitter ?? {}),
    },
    alternate,
  };
}
