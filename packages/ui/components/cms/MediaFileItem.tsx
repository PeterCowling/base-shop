// packages/ui/components/cms/MediaFileItem.tsx
"use client";
import type { MediaItem } from "@types";
import Image from "next/image";

interface Props {
  item: MediaItem;
  onDelete: (url: string) => void;
}

export default function MediaFileItem({ item, onDelete }: Props) {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-md border">
      <button
        onClick={() => onDelete(item.url)}
        className="absolute top-1 right-1 rounded bg-black/50 px-1.5 text-xs text-white"
      >
        Delete
      </button>
      <Image
        src={item.url}
        alt={item.altText || "media"}
        fill
        className="object-cover"
      />
      {item.altText && (
        <p className="absolute bottom-1 left-1 bg-black/50 px-1 text-xs text-white">
          {item.altText}
        </p>
      )}
    </div>
  );
}
