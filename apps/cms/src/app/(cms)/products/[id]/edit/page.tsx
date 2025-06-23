// apps/cms/src/app/(cms)/products/[id]/edit/page.tsx
import { ProductPublication } from "@platform-core/products";
import { getProductById } from "@platform-core/repositories/json";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

/* -------------------------------------------------------------------------- */
/*  Lazy-load the client form (code-split only)                               */
/* -------------------------------------------------------------------------- */
const ProductEditorForm = dynamic(
  () => import("@ui/components/cms/ProductEditorForm")
);

/* `params` is now a Promise<{ id: string }> in RSC pages */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params; // ← unwrap first

  // Phase-0 ⇒ shop is hard-coded to "abc"
  const product: ProductPublication | null = await getProductById("abc", id);
  if (!product) return notFound();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Edit product</h1>
      <ProductEditorForm initialProduct={product} />
    </>
  );
}
