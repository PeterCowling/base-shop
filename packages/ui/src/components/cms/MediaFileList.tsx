// packages/ui/components/cms/MediaFileList.tsx
"use client";
import type { MediaItem } from "@acme/types";
import MediaFileItem from "./MediaFileItem";

interface Props {
  /** List of files already filtered by the parent component */
  files: MediaItem[];
  onDelete: (url: string) => void;
}

export default function MediaFileList({ files, onDelete }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {files.map((item) => (
        <MediaFileItem key={item.url} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
}
