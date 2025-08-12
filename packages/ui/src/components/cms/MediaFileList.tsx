// packages/ui/components/cms/MediaFileList.tsx
"use client";
import type { MediaItem } from "@acme/types";
import MediaFileItem from "./MediaFileItem";

interface Props {
  files: MediaItem[];
  onDelete: (url: string) => void;
  onUpdate: (url: string, alt: string) => void | Promise<void>;
}

export default function MediaFileList({ files, onDelete, onUpdate }: Props) {
  if (files.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {files.map((item) => (
        <MediaFileItem
          key={item.url}
          item={item}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
