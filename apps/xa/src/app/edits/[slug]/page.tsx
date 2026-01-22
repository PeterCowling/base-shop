import { Suspense } from "react";
import { notFound } from "next/navigation";

import { XaProductListing } from "../../../components/XaProductListing.client";
import { XA_PRODUCTS } from "../../../lib/demoData";
import { XA_EDITS } from "../../../lib/xaEdits";

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const edit = XA_EDITS.find((entry) => entry.slug === slug);
  if (!edit) notFound();

  const products = edit.productSlugs
    .map((handle) => XA_PRODUCTS.find((product) => product.slug === handle))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  return (
    <Suspense fallback={null}>
      <XaProductListing
        title={edit.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Edits", href: "/edits" },
          { label: edit.title },
        ]}
        products={products}
      />
    </Suspense>
  );
}
