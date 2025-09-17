// apps/cms/src/app/cms/shop/[shop]/products/[id]/edit/ProductEditor.tsx
"use client";

import { updateProduct } from "@cms/actions/products.server";
import type { ProductPublication } from "@platform-core/products";
import type { Locale } from "@acme/types";
import ProductEditorForm from "@ui/components/cms/ProductEditorForm";

interface Props {
  shop: string;
  initialProduct: ProductPublication & { variants?: Record<string, string[]> };
  languages: readonly Locale[];
  formId?: string;
}

export default function ProductEditor({
  shop,
  initialProduct,
  languages,
  formId = "product-editor-form",
}: Props) {
  const onSave = (fd: FormData) => updateProduct(shop, fd);
  return (
    <ProductEditorForm
      product={{ ...initialProduct, variants: initialProduct.variants ?? {} }}
      onSave={onSave}
      locales={languages}
      formId={formId}
    />
  );
}
