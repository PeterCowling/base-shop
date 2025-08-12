// packages/ui/components/cms/MediaFileList.tsx
"use client";
import type { MediaItem } from "@acme/types";
import MediaFileItem from "./MediaFileItem";

interface Props {
  /** List of files already filtered by the parent component */
  files: MediaItem[];
  shop: string;
  onDelete: (url: string) => void;
  onReplace: (oldUrl: string, item: MediaItem) => void;
}

export default function MediaFileList({
  files,
  shop,
  onDelete,
  onReplace,
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
        />
      ))}
    </div>
  );
}
