import { notFound } from "next/navigation";

import { XaProductDetail } from "../../../components/XaProductDetail";
import { getXaProductByHandle, XA_PRODUCTS } from "../../../lib/demoData";

export function generateStaticParams() {
  return XA_PRODUCTS.map((p) => ({ handle: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = getXaProductByHandle(handle);
  if (!product) notFound();
  return <XaProductDetail product={product} products={XA_PRODUCTS} />;
}
