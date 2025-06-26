// apps/cms/src/app/cms/shop/[shop]/products/[id]/edit/ProductEditor.tsx
"use client";

import { updateProduct } from "@cms/actions/products";
import type { Locale, ProductPublication } from "@platform-core/products";
import ProductEditorForm from "@ui/components/cms/ProductEditorForm";

interface Props {
  shop: string;
  initialProduct: ProductPublication;
  languages: Locale[];
}

export default function ProductEditor({
  shop,
  initialProduct,
  languages,
}: Props) {
  const onSave = (fd: FormData) => updateProduct(shop, fd);
  return (
    <ProductEditorForm
      product={initialProduct}
      onSave={onSave}
      locales={languages}
    />
  );
}
