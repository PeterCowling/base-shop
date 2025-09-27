// packages/template-app/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@platform-core/products";
import type { SKU } from "@acme/types";
import type { Metadata } from "next";
import ShopClient from "./ShopClient.client";
import { getStructuredData, serializeJsonLd } from "../../../lib/seo";

export const metadata: Metadata = {
  title: "Shop · Base-Shop", // i18n-exempt: brand name in SEO title
};

export default async function ShopIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const jsonLd = getStructuredData({
    type: "WebPage",
    name: "Shop", // i18n-exempt: schema.org name for generic page
    url: `/${lang}/shop`,
  });
  // ⬇️ Purely server-side: just pass static data to the client component
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ShopClient skus={PRODUCTS as SKU[]} />
    </>
  );
}
