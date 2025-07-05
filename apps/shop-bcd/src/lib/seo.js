import { getShopSettings } from "@platform-core/repositories/settings.server";
const fallback = {
    title: "",
    description: "",
    canonical: "",
    openGraph: {},
    twitter: {},
};
export async function getSeo(locale, pageSeo = {}) {
    const shop = process.env.NEXT_PUBLIC_SHOP_ID || "default";
    const settings = await getShopSettings(shop);
    const shopSeo = (settings.seo ?? {});
    const base = shopSeo[locale] ?? {};
    const canonicalBase = base.canonicalBase ?? "";
    return {
        title: pageSeo.title ?? base.title ?? fallback.title,
        description: pageSeo.description ?? base.description ?? fallback.description,
        canonical: pageSeo.canonical ??
            base.canonical ??
            (canonicalBase ? `${canonicalBase}/${locale}` : fallback.canonical),
        openGraph: {
            ...(fallback.openGraph ?? {}),
            ...(base.openGraph ?? {}),
            ...(pageSeo.openGraph ?? {}),
            url: pageSeo.openGraph?.url ??
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
