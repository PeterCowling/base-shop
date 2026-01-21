import { notFound } from "next/navigation";
import { Suspense } from "react";

import { XaProductListing } from "../../../components/XaProductListing.client";
import { XA_COLLECTIONS, XA_PRODUCTS } from "../../../lib/demoData";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  if (handle === "all") {
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

  const collection = XA_COLLECTIONS.find((c) => c.handle === handle);
  if (!collection) notFound();

  const products = XA_PRODUCTS.filter((p) => p.collection === handle);

  return (
    <Suspense fallback={null}>
      <XaProductListing
        title={`# ${collection.title}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          { label: collection.title },
        ]}
        products={products}
      />
    </Suspense>
  );
}
