// apps/cms/src/app/cms/shop/[shop]/products/[id]/edit/page.tsx

import {
  getProductById,
  readSettings,
} from "@acme/platform-core/repositories/json.server";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@acme/ui/components/atoms/shadcn";
import ProductEditHero from "./ProductEditHero.client";

/* ------------------------------------------------------------------ */
/*  Lazy-load wrapper (client component)                              */
/* ------------------------------------------------------------------ */
const ProductEditor = dynamic(() => import("./ProductEditor.client"));

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

  const formId = "product-editor-form";

  return (
    <div className="flex h-full flex-col gap-6">
      <ProductEditHero
        shop={shop}
        productId={id}
        status={product.status}
        sku={product.sku}
        publishTarget={product.shop ?? shop}
        formId={formId}
      />
      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-y-auto p-6">
            <ProductEditor
              shop={shop}
              initialProduct={product}
              languages={[...settings.languages]}
              formId={formId}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
