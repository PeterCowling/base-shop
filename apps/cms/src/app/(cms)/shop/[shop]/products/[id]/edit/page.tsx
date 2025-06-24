// apps/cms/src/app/(cms)/shop/[shop]/products/[id]/edit/page.tsx

import { getProductById, readSettings } from "@platform-core/repositories/json";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Lazy-load wrapper (client component)                              */
/* ------------------------------------------------------------------ */
const ProductEditor = dynamic(() => import("./ProductEditor"));

interface Params {
  shop: string;
  id: string;
}

export default async function ProductEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop, id } = await params;
  const [product, settings] = await Promise.all([
    getProductById(shop, id),
    readSettings(shop),
  ]);
  if (!product) return notFound();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">
        Edit product &ndash; {shop}/{id}
      </h1>
      <ProductEditor
        shop={shop}
        initialProduct={product}
        languages={settings.languages}
      />
    </>
  );
}
