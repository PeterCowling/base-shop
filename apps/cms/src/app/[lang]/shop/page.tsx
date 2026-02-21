// apps/cms/src/app/[lang]/shop/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";

import { PRODUCTS } from "@acme/platform-core/products";
import type { SKU } from "@acme/types";

import ShopClient from "./ShopClient.client";

export const metadata: Metadata = {
  title: "Shop · Base-Shop",
};

export default function ShopIndexPage() {
  // ⬇️ Purely server-side: just pass static data to the client component
  return (
    <Suspense fallback={null}>
      <ShopClient skus={PRODUCTS as SKU[]} />
    </Suspense>
  );
}
