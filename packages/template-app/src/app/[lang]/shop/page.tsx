// packages/template-app/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@platform-core/products";
import type { SKU } from "@acme/types";
import type { Metadata } from "next";
import ShopClient from "./ShopClient.client";
import { getStructuredData, serializeJsonLd } from "../../../lib/seo";
import { resolveLocale, type Locale } from "@i18n/locales";
import { useTranslations as getServerTranslations } from "@i18n/useTranslations.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const locale: Locale = resolveLocale(raw);
  const t = await getServerTranslations(locale);
  return { title: t("shop.title") };
}

export default async function ShopIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getServerTranslations(resolveLocale(lang));
  const jsonLd = getStructuredData({
    type: "WebPage", /* i18n-exempt -- DX-1023 [ttl=2026-12-31] schema.org type constant */
    name: t("nav.shop"),
    url: `/${lang}/shop`,
  });
  // ⬇️ Purely server-side: just pass static data to the client component
  return (
    <>
      {/* i18n-exempt -- DX-1023 [ttl=2026-12-31] non-visual JSON-LD script */}
      <script
        type="application/ld+json" /* i18n-exempt -- DX-1023 [ttl=2026-12-31] MIME type constant, not user-facing copy */
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ShopClient skus={PRODUCTS as SKU[]} />
    </>
  );
}
