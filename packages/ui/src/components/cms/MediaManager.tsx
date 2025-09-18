// packages/ui/src/components/cms/MediaManager.tsx
"use client";

import { memo, ReactElement } from "react";
import type { MediaItem } from "@acme/types";

import MediaDetailsPanel, {
  type MediaDetailsFormValues,
} from "./media/details/MediaDetailsPanel";
import MediaManagerView from "./media/MediaManagerView";
import { useMediaManagerState } from "./media/hooks/useMediaManagerState";

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

function MediaManagerBase({
  shop,
  initialFiles,
  onDelete,
  onMetadataUpdate,
  uploaderTargetId,
}: Props): ReactElement {
  const state = useMediaManagerState({
    shop,
    initialFiles,
    onDelete,
    onMetadataUpdate,
  });

  return (
    <MediaManagerView
      shop={shop}
      uploaderTargetId={uploaderTargetId}
      {...state}
    />
  );
}

export { MediaDetailsPanel };
export type {
  MediaDetailsFormValues,
  MediaDetailsPanelProps,
} from "./media/details/MediaDetailsPanel";

export default memo(MediaManagerBase);
