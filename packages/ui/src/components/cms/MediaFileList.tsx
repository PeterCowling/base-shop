// packages/ui/components/cms/MediaFileList.tsx
"use client";
import type { MediaItem } from "@acme/types";

import MediaFileItem from "./MediaFileItem";

type WithUrl = MediaItem & { url: string };

interface Props {
  /** List of files already filtered by the parent component */
  files: WithUrl[];
  shop: string;
  onDelete: (url: string) => void;
  onReplace: (oldUrl: string, item: MediaItem) => void;
  onSelect?: (item: WithUrl | null) => void;
  onBulkToggle?: (item: WithUrl, selected: boolean) => void;
  selectionEnabled?: boolean;
  isItemSelected?: (item: WithUrl) => boolean;
  isDeleting?: (item: WithUrl) => boolean;
  isReplacing?: (item: WithUrl) => boolean;
  onReplaceSuccess?: (newItem: MediaItem) => void;
  onReplaceError?: (message: string) => void;
}

export default function MediaFileList({
  files,
  shop,
  onDelete,
  onReplace,
  onSelect,
  onBulkToggle,
  selectionEnabled = false,
  isItemSelected,
  isDeleting,
  isReplacing,
  onReplaceSuccess,
  onReplaceError,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {files.map((item) => (
        <MediaFileItem
          key={item.url}
          item={item}
          shop={shop}
          onDelete={onDelete}
          onReplace={onReplace}
          onSelect={onSelect}
          onBulkToggle={onBulkToggle}
          selectionEnabled={selectionEnabled}
          selected={isItemSelected?.(item) ?? false}
          deleting={isDeleting?.(item)}
          replacing={isReplacing?.(item)}
          onReplaceSuccess={onReplaceSuccess}
          onReplaceError={onReplaceError}
        />
      ))}
    </div>
  );
}
