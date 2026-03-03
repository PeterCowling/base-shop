import { notFound } from "next/navigation";

import { XA_BRANDS, XA_PRODUCTS } from "../../../lib/demoData";

import { DesignerPageClient } from "./DesignerPageClient";

export function generateStaticParams() {
  return XA_BRANDS.map((b) => ({ slug: b.handle }));
}

export default async function DesignerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const designer = XA_BRANDS.find((item) => item.handle === slug);
  if (!designer) notFound();

  const designerProducts = XA_PRODUCTS.filter((product) => product.brand === slug);

  return (
    <DesignerPageClient
      designer={designer}
      designerProducts={designerProducts}
    />
  );
}
