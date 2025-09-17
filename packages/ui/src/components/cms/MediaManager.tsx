// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement, useCallback, useMemo, useState } from "react";
import type { MediaItem } from "@acme/types";
import MediaDetailsPanel, {
  type MediaDetailsFormValues,
} from "./media/MediaDetailsPanel";
import Library from "./media/Library";
import UploadPanel from "./media/UploadPanel";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type MediaItemWithUrl = MediaItem & { url: string };

interface Props {
  shop: string;
  initialFiles: MediaItem[];

  /**
   * Removes a media item on the server.
   * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
   */
  onDelete: (shop: string, src: string) => void | Promise<void>;
  onMetadataUpdate: (
    shop: string,
    src: string,
    fields: MediaDetailsFormValues
  ) => MediaItem | Promise<MediaItem>;
  uploaderTargetId?: string;
}

function hasUrl(item: MediaItem): item is MediaItemWithUrl {
  return typeof item.url === "string" && item.url.length > 0;
}

function ensureHasUrl(items: MediaItem[]): MediaItemWithUrl[] {
  return items.filter(hasUrl);
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function MediaManagerBase({
  shop,
  initialFiles,
  onDelete,
  onMetadataUpdate,
  uploaderTargetId,
}: Props): ReactElement {
  const [files, setFiles] = useState<MediaItemWithUrl[]>(() =>
    ensureHasUrl(initialFiles)
  );
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [metadataPending, setMetadataPending] = useState(false);

  const selectedItem = useMemo(() => {
    if (!selectedUrl) return null;
    return files.find((file) => file.url === selectedUrl) ?? null;
  }, [files, selectedUrl]);

  const handleDelete = useCallback(
    async (src: string) => {
      if (!confirm("Delete this image?")) return;
      await onDelete(shop, src);
      setFiles((prev) => prev.filter((f) => f.url !== src));
      setSelectedUrl((prev) => (prev === src ? null : prev));
    },
    [onDelete, shop]
  );

  const handleUploaded = useCallback((item: MediaItem) => {
    if (!hasUrl(item)) {
      console.error("Uploaded media item is missing a URL", item);
      return;
    }
    setFiles((prev) => [item, ...prev]);
  }, []);

  const handleReplace = useCallback((oldUrl: string, item: MediaItem) => {
    if (!hasUrl(item)) {
      console.error("Replacement media item is missing a URL", item);
      return;
    }
    setFiles((prev) => prev.map((f) => (f.url === oldUrl ? item : f)));
    setSelectedUrl((prev) => (prev === oldUrl ? item.url : prev));
  }, []);

  const handleReplaceSuccess = useCallback((item: MediaItem) => {
    if (!hasUrl(item)) {
      console.error("Replacement media item is missing a URL", item);
      return;
    }
    setSelectedUrl(item.url);
  }, []);

  const handleReplaceError = useCallback((message: string) => {
    console.error("Failed to replace media item", message);
  }, []);

  const handleSelect = useCallback((item: MediaItemWithUrl | null) => {
    setSelectedUrl(item?.url ?? null);
  }, []);

  const handleMetadataSubmit = useCallback(
    async (fields: MediaDetailsFormValues) => {
      if (!selectedItem) return;

      const currentUrl = selectedItem.url;
      setMetadataPending(true);
      try {
        const updated = await onMetadataUpdate(shop, currentUrl, fields);
        if (!hasUrl(updated)) {
          console.error("Updated media item is missing a URL", updated);
          return;
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.url === currentUrl
              ? ({ ...file, ...updated } as MediaItemWithUrl)
              : file
          )
        );
        setSelectedUrl(updated.url);
      } catch (error) {
        console.error("Failed to update media metadata", error);
      } finally {
        setMetadataPending(false);
      }
    },
    [onMetadataUpdate, selectedItem, shop]
  );

  const handleCloseDetails = useCallback(() => {
    setSelectedUrl(null);
  }, []);

  return (
    <div className="space-y-6">
      <UploadPanel
        shop={shop}
        onUploaded={handleUploaded}
        focusTargetId={uploaderTargetId}
      />
      <Library
        files={files}
        shop={shop}
        onDelete={handleDelete}
        onReplace={handleReplace}
        onReplaceSuccess={handleReplaceSuccess}
        onReplaceError={handleReplaceError}
        onSelect={handleSelect}
      />
      {selectedItem ? (
        <MediaDetailsPanel
          open
          item={selectedItem}
          pending={metadataPending}
          onSubmit={handleMetadataSubmit}
          onClose={handleCloseDetails}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export { MediaDetailsPanel };
export type {
  MediaDetailsFormValues,
  MediaDetailsPanelProps,
} from "./media/MediaDetailsPanel";

export default memo(MediaManagerBase);

