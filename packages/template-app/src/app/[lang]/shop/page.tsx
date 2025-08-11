// packages/template-app/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@platform-core/src/products";
import type { SKU } from "@acme/types";
import type { Metadata } from "next";
import ShopClient from "./ShopClient.client";
import { getStructuredData } from "../../../lib/seo";

export const metadata: Metadata = {
  title: "Shop · Base-Shop",
};

export default function ShopIndexPage({
  params,
}: {
  params: { lang: string };
}) {
  const jsonLd = getStructuredData({
    type: "WebPage",
    name: "Shop",
    url: `/${params.lang}/shop`,
  });
  // ⬇️ Purely server-side: just pass static data to the client component
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShopClient skus={PRODUCTS as SKU[]} />
    </>
  );
}
