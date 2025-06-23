import type { ProductPublication } from "@platform-core/products";
import { getProductById } from "@platform-core/repositories/json";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const ProductEditorForm = dynamic(
  () => import("@ui/components/cms/ProductEditorForm")
);

interface Params {
  shop: string;
  id: string;
}

export default async function ProductEditPage({ params }: { params: Params }) {
  const { shop, id } = params;
  const product: ProductPublication | null = await getProductById(shop, id);
  if (!product) return notFound();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">
        Edit product &ndash; {shop}/{id}
      </h1>
      <ProductEditorForm initialProduct={product} shop={shop} />
    </>
  );
}
