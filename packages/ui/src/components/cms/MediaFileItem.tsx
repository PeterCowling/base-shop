// packages/ui/components/cms/MediaFileItem.tsx
"use client";
import type { MediaItem } from "@acme/types";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Input } from "@ui/components/atoms/shadcn";

interface Props {
  item: MediaItem;
  onDelete: (url: string) => void;
  onUpdate: (url: string, alt: string) => void | Promise<void>;
}

export default function MediaFileItem({ item, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [alt, setAlt] = useState(item.altText || "");

  useEffect(() => {
    setAlt(item.altText || "");
  }, [item.altText]);

  const save = async () => {
    await onUpdate(item.url, alt);
    setEditing(false);
  };

  const isVideo = /\.(mp4|webm|ogg)$/i.test(item.url);

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-md border">
      <button
        onClick={() => onDelete(item.url)}
        className="absolute top-1 right-1 rounded bg-fg/50 px-1.5 text-xs text-bg"
      >
        Delete
      </button>
      {isVideo ? (
        <video src={item.url} className="h-full w-full object-cover" muted />
      ) : (
        <Image
          src={item.url}
          alt={item.altText || "media"}
          fill
          className="object-cover"
        />
      )}
      {editing ? (
        <div className="absolute inset-0 flex flex-col justify-center bg-bg/80 p-2">
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Alt text"
            className="mb-2 h-7 text-xs"
          />
          <div className="flex gap-1">
            <button
              onClick={save}
              className="rounded bg-primary px-1.5 text-xs text-primary-fg"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setAlt(item.altText || "");
              }}
              className="rounded bg-muted px-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="absolute bottom-1 left-1 bg-fg/50 px-1 text-xs text-bg"
        >
          {item.altText || "Add alt"}
        </button>
      )}
    </div>
  );
}
