// apps/cms/src/app/(cms)/shop/[shop]/products/[id]/edit/ProductEditor.tsx
"use client";

import { updateProduct } from "@cms/actions/products";
import type { ProductPublication } from "@types/Product";
import ProductEditorForm from "@ui/components/cms/ProductEditorForm";

interface Props {
  shop: string;
  initialProduct: ProductPublication;
}

export default function ProductEditor({ shop, initialProduct }: Props) {
  const onSave = (fd: FormData) => updateProduct(shop, fd);
  return <ProductEditorForm product={initialProduct} onSave={onSave} />;
}
