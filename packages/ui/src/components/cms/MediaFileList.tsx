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
  onSelect?: (item: WithUrl) => void;
  onOpenDetails?: (item: WithUrl) => void;
  onBulkToggle?: (item: WithUrl, selected: boolean) => void;
  selectionEnabled?: boolean;
  isItemSelected?: (item: WithUrl) => boolean;
}

export default function MediaFileList({
  files,
  shop,
  onDelete,
  onReplace,
  onSelect,
  onOpenDetails,
  onBulkToggle,
  selectionEnabled = false,
  isItemSelected,
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
          onOpenDetails={onOpenDetails}
          onBulkToggle={onBulkToggle}
          selectionEnabled={selectionEnabled}
          selected={isItemSelected?.(item) ?? false}
        />
      ))}
    </div>
  );
}
