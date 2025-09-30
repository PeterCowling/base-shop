// packages/ui/src/components/cms/media/hooks/utils/utils.ts
import type { MediaItem } from "@acme/types";
import type { MediaItemWithUrl } from "./types";

export function hasUrl(item: MediaItem): item is MediaItemWithUrl {
  return typeof item.url === "string" && item.url.length > 0;
}

export function ensureHasUrl(items: MediaItem[]): MediaItemWithUrl[] {
  return items.reduce<MediaItemWithUrl[]>((accumulator, item) => {
    if (!hasUrl(item)) {
      console.warn(/* i18n-exempt -- DEV-LOG-002 [ttl=2026-01-01] */ "cms.media.upload.missingUrl", item);
      return accumulator;
    }

    accumulator.push(item);
    return accumulator;
  }, []);
}
