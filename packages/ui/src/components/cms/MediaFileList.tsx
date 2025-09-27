// packages/ui/components/cms/MediaFileList.tsx
"use client";
import type { MediaItem } from "@acme/types";

import MediaFileItem from "./MediaFileItem";
import { Grid } from "../atoms/primitives/Grid";

type WithUrl = MediaItem & { url: string };

interface Props {
  /** List of files already filtered by the parent component */
  files: WithUrl[];
  shop: string;
  onDelete: (url: string) => void;
  onReplace: (oldUrl: string, item: MediaItem) => void;
  onReplaceSuccess?: (item: MediaItem) => void;
  onReplaceError?: (message: string) => void;
  onSelect?: (item: WithUrl | null) => void;
  onBulkToggle?: (item: WithUrl, selected: boolean) => void;
  selectionEnabled?: boolean;
  isItemSelected?: (item: WithUrl) => boolean;
  isDeleting?: (item: WithUrl) => boolean;
  isReplacing?: (item: WithUrl) => boolean;
}

export default function MediaFileList({
  files,
  shop,
  onDelete,
  onReplace,
  onReplaceSuccess,
  onReplaceError,
  onSelect,
  onBulkToggle,
  selectionEnabled = false,
  isItemSelected,
  isDeleting,
  isReplacing,
}: Props) {
  return (
    <Grid cols={2} gap={4} className="sm:grid-cols-4">
      {files.map((item) => (
        <MediaFileItem
          key={item.url}
          item={item}
          shop={shop}
          onDelete={onDelete}
          onReplace={onReplace}
          onReplaceSuccess={onReplaceSuccess}
          onReplaceError={onReplaceError}
          onSelect={onSelect}
          onBulkToggle={onBulkToggle}
          selectionEnabled={selectionEnabled}
          selected={isItemSelected?.(item) ?? false}
          deleting={isDeleting?.(item)}
          replacing={isReplacing?.(item)}
        />
      ))}
    </Grid>
  );
}
