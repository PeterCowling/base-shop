// packages/ui/utils/buildProductFormData.ts
import type { Locale } from "@acme/i18n";
import type { ProductWithVariants } from "../hooks/useProductInputs";

export function buildProductFormData(
  product: ProductWithVariants,
  publishTargets: string[],
  locales: readonly Locale[]
): FormData {
  const fd = new FormData();
  fd.append("id", product.id);

  locales.forEach((l: Locale) => {
    fd.append(`title_${l}`, product.title[l]);
    fd.append(`desc_${l}`, product.description[l]);
  });

  fd.append("price", String(product.price));
  fd.append("media", JSON.stringify(product.media));
  fd.append("publish", publishTargets.join(","));

  Object.entries(product.variants).forEach(([k, vals]) => {
    fd.append(`variant_${k}`, (vals as string[]).filter(Boolean).join(","));
  });

  return fd;
}

export default buildProductFormData;
