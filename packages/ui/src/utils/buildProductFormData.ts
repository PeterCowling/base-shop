// packages/ui/utils/buildProductFormData.ts
import type { Locale } from "@acme/i18n";
import type { MediaItem } from "@acme/types";
import type { ProductWithVariants } from "../hooks/useProductInputs";

type MediaWithFile = MediaItem & { file?: File };

function hasFileProperty(item: MediaItem): item is MediaWithFile {
  return "file" in item;
}

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

  // Extract file attachments from media items and append them separately
  const mediaWithoutFiles = product.media.map(
    (item: MediaItem, index: number): MediaItem => {
      if (!hasFileProperty(item)) {
        return item;
      }

      if (item.file instanceof File) {
        fd.append(`file_${index}`, item.file);
      }

      const { file: _file, ...rest } = item;
      void _file;
      return rest;
    },
  );

  fd.append("media", JSON.stringify(mediaWithoutFiles));
  fd.append("publish", publishTargets.join(","));

  Object.entries(product.variants).forEach(([k, vals]) => {
    fd.append(`variant_${k}`, (vals as string[]).filter(Boolean).join(","));
  });

  return fd;
}

export default buildProductFormData;
