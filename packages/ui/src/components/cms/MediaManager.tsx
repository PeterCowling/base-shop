// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement, useCallback, useState } from "react";
import type { MediaItem } from "@acme/types";
import MediaDetailsPanel from "./media/MediaDetailsPanel";
import Library from "./media/Library";
import UploadPanel from "./media/UploadPanel";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Props {
  shop: string;
  initialFiles: MediaItem[];

  /**
   * Removes a media item on the server.
   * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
   */
  onDelete: (shop: string, src: string) => void | Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function MediaManagerBase({
  shop,
  initialFiles,
  onDelete,
}: Props): ReactElement {
  const [files, setFiles] = useState<MediaItem[]>(initialFiles);

  const handleDelete = useCallback(
    async (src: string) => {
       
      if (!confirm("Delete this image?")) return;
      await onDelete(shop, src);
      setFiles((prev) => prev.filter((f) => f.url !== src));
    },
    [onDelete, shop]
  );

  const handleUploaded = useCallback(
    (item: MediaItem) => {
      setFiles((prev) => [item, ...prev]);
    },
    []
  );

  const handleReplace = useCallback(
    (oldUrl: string, item: MediaItem) => {
      setFiles((prev) => prev.map((f) => (f.url === oldUrl ? item : f)));
    },
    []
  );

  return (
    <div className="space-y-6">
      <UploadPanel shop={shop} onUploaded={handleUploaded} />
      <Library
        files={files}
        shop={shop}
        onDelete={handleDelete}
        onReplace={handleReplace}
      />
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

