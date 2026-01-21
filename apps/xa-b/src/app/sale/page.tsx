import { Suspense } from "react";

import { XaProductListing } from "../../components/XaProductListing.client";
import { XA_PRODUCTS } from "../../lib/demoData";

export default function SalePage() {
  const products = XA_PRODUCTS.filter(
    (product) => product.compareAtPrice && product.compareAtPrice > product.price,
  );

  return (
    <Suspense fallback={null}>
      <XaProductListing
        title="Sale"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sale" }]}
        products={products}
      />
    </Suspense>
  );
}
