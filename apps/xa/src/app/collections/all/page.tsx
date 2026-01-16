import { Suspense } from "react";

import { XaProductListing } from "../../../components/XaProductListing.client";
import { XA_PRODUCTS } from "../../../lib/demoData";

export default function AllProductsPage() {
  return (
    <Suspense fallback={null}>
      <XaProductListing
        title="# ALL Products"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "ALL Products" },
        ]}
        products={XA_PRODUCTS}
      />
    </Suspense>
  );
}
