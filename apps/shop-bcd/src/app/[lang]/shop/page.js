import { jsx as _jsx } from "react/jsx-runtime";
// apps/shop-bcd/src/app/[lang]/shop/page.tsx
import { PRODUCTS } from "@acme/products";
import ShopClient from "./ShopClient.client";
export const metadata = {
    title: "Shop · Base-Shop",
};
export default function ShopIndexPage() {
    // ⬇️ Purely server-side: just pass static data to the client component
    return _jsx(ShopClient, { skus: PRODUCTS });
}
