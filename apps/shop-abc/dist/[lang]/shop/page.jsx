import { PRODUCTS } from "@/lib/products";
import ShopClient from "./ShopClient";
export const metadata = {
    title: "Shop · Base-Shop",
};
export default function ShopIndexPage() {
    // ⬇️ Purely server-side: just pass static data to the client component
    return <ShopClient skus={PRODUCTS}/>;
}
