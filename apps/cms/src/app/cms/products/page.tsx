// apps/cms/src/app/cms/products/page.tsx
import { redirect } from "next/navigation";
import { listShops } from "../listShops";

export default async function ProductsIndexPage() {
  const shops = await listShops();
  if (shops.length > 0) {
    redirect(`/cms/shop/${shops[0]}/products`);
  }
  return <p>No shops found.</p>;
}
