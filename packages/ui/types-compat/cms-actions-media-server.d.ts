declare module "@cms/actions/media.server" {
  import type { MediaItem } from "@acme/types";
  import type { MediaDetailsFormValues } from "@acme/ui/components/cms/MediaManager";

  export const deleteMedia: (shop: string, src: string) => Promise<void>;
  export const updateMediaMetadata: (
    shop: string,
    src: string,
    fields: MediaDetailsFormValues
  ) => Promise<MediaItem>;
}
