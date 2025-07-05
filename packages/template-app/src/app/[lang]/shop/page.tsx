// packages/template-app/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@platform-core/src/products";
import type { SKU } from "@types";
import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop · Base-Shop",
};

export default function ShopIndexPage() {
  // ⬇️ Purely server-side: just pass static data to the client component
  return <ShopClient skus={PRODUCTS as SKU[]} />;
}
