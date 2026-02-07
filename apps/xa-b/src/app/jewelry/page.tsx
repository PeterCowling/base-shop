import { Suspense } from "react";
import { notFound } from "next/navigation";

import { XaProductListing } from "../../components/XaProductListing.client";
import { XA_PRODUCTS } from "../../lib/demoData";
import { isCategoryAllowed,XA_CATEGORY_LABELS } from "../../lib/xaCatalog";

export default function JewelryPage() {
  if (!isCategoryAllowed("jewelry")) notFound();

  const products = XA_PRODUCTS.filter((product) => product.taxonomy.category === "jewelry");
  const title = XA_CATEGORY_LABELS.jewelry;

  return (
    <Suspense fallback={null}>
      <XaProductListing
        title={title}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: title }]}
        products={products}
        category="jewelry"
      />
    </Suspense>
  );
}
