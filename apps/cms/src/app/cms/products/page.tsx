// apps/cms/src/app/cms/products/page.tsx

import { redirect } from "next/navigation";

export default function ProductsRedirectPage() {
  const shop = process.env.NEXT_PUBLIC_DEFAULT_SHOP || "default";
  redirect(`/cms/shop/${shop}/products`);
}
