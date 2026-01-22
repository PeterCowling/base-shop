// apps/cms/src/app/cms/shop/[shop]/products/[id]/edit/ProductEditor.tsx
"use client";

import { updateProduct } from "@cms/actions/products.server";

import ProductEditorForm from "@acme/cms-ui/ProductEditorForm";
import { type Locale as UiLocale,LOCALES as UILOCALES } from "@acme/i18n/locales";
import type { ProductPublication } from "@acme/platform-core/products";
import type { Locale } from "@acme/types";

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
  const uiLocales = languages.filter((l): l is UiLocale =>
    (UILOCALES as readonly string[]).includes(l as unknown as string)
  );
  return (
    <ProductEditorForm
      product={{ ...initialProduct, variants: initialProduct.variants ?? {} } as any}
      onSave={onSave}
      locales={uiLocales}
      formId={formId}
    />
  );
}
