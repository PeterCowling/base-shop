// packages/ui/components/cms/MediaFileItem.tsx
"use client";
import type { MediaItem } from "@acme/types";
import { Input } from "@ui/components/atoms/shadcn";
import Image from "next/image";
import { useState } from "react";

interface Props {
  item: MediaItem;
  onDelete: (url: string) => void;
  onAltTextSave?: (url: string, altText: string) => void;
}

export default function MediaFileItem({
  item,
  onDelete,
  onAltTextSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.altText || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAltTextSave?.(item.url, text);
    setEditing(false);
  };

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-md border">
      <button
        onClick={() => onDelete(item.url)}
        className="absolute top-1 right-1 rounded bg-fg/50 px-1.5 text-xs text-bg"
      >
        Delete
      </button>
      {item.type === "image" ? (
        <Image
          src={item.url}
          alt={item.altText || "media"}
          fill
          className="object-cover"
        />
      ) : (
        <video
          src={item.url}
          controls
          className="h-full w-full object-cover"
        />
      )}

      {/* Alt text overlay / editor */}
      <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1 bg-fg/50 px-1 text-xs text-bg">
        {editing ? (
          <form onSubmit={handleSubmit} className="flex w-full gap-1">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-6 flex-1 px-1 py-0 text-xs"
              placeholder="Alt text"
            />
            <button
              type="submit"
              className="rounded bg-primary px-1 text-[10px] text-primary-fg"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setText(item.altText || "");
              }}
              className="rounded bg-muted px-1 text-[10px] text-muted-fg"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex w-full items-center justify-between">
            <span className="truncate">{item.altText || ""}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded bg-primary px-1 text-[10px] text-primary-fg"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
