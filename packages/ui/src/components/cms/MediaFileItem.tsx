// packages/ui/components/cms/MediaFileItem.tsx
"use client";
import type { MediaItem } from "@acme/types";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
  item: MediaItem;
  onDelete: (url: string) => void;
  onUpdate: (url: string, altText: string) => Promise<void>;
}

export default function MediaFileItem({ item, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.altText ?? "");

  useEffect(() => {
    setValue(item.altText ?? "");
  }, [item.altText]);

  const save = async () => {
    await onUpdate(item.url, value);
    setEditing(false);
  };

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-md border">
      <div className="absolute top-1 right-1 flex gap-1">
        <button
          onClick={() => onDelete(item.url)}
          className="rounded bg-fg/50 px-1.5 text-xs text-bg"
        >
          Delete
        </button>
        {item.type === "image" && (
          <button
            onClick={() => setEditing((e) => !e)}
            className="rounded bg-fg/50 px-1.5 text-xs text-bg"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        )}
      </div>
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
      {item.type === "image" && (
        <div className="absolute bottom-1 left-1 right-1">
          {editing ? (
            <div className="flex gap-1 bg-fg/50 p-1">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded px-1 text-xs"
              />
              <button
                onClick={save}
                className="rounded bg-primary px-1 text-xs text-primary-fg"
              >
                Save
              </button>
            </div>
          ) : (
            item.altText && (
              <p className="bg-fg/50 px-1 text-xs text-bg">{item.altText}</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
