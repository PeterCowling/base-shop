declare module "@cms/actions/media.server" {
  import type { ImageOrientation, MediaItem } from "@types";

  export function listMedia(shop: string): Promise<MediaItem[]>;

  export function uploadMedia(
    shop: string,
    formData: FormData,
    requiredOrientation?: ImageOrientation
  ): Promise<MediaItem>;

  export function deleteMedia(shop: string, filePath: string): Promise<void>;
}

declare module "@cms/actions/products.server" {
  export function duplicateProduct(shop: string, id: string): Promise<void>;
  export function deleteProduct(shop: string, id: string): Promise<void>;
}

export {};
