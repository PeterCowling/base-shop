// packages/ui/components/cms/MediaFileItem.tsx
"use client";
import type { ApiError, MediaItem } from "@acme/types";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@ui/components/atoms/shadcn";

interface Props {
  item: MediaItem;
  shop: string;
  onDelete: (url: string) => void;
  onReplace: (oldUrl: string, item: MediaItem) => void;
}

export default function MediaFileItem({
  item,
  shop,
  onDelete,
  onReplace,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.altText ?? "");
  const [tagText, setTagText] = useState(item.tags?.join(", ") ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const file = new File([blob], item.url.split("/").pop() || "file", {
        type: blob.type,
      });
      const fd = new FormData();
      fd.append("file", file);
      if (text) fd.append("altText", text);
      const tags = tagText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length) fd.append("tags", JSON.stringify(tags));
      const uploadRes = await fetch(`/cms/api/media?shop=${shop}`, {
        method: "POST",
        body: fd,
      });
      const data = (await uploadRes.json()) as MediaItem | ApiError;
      if ("error" in data) throw new Error(data.error);
      await onDelete(item.url);
      onReplace(item.url, data);
      setEditing(false);
    } catch {
      /* ignore errors for now */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-md border">
      <div className="absolute top-1 right-1 flex gap-1">
        <button
          onClick={() => setEditing((e) => !e)}
          className="bg-fg/50 text-bg rounded px-1.5 text-xs"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
        <button
          onClick={() => onDelete(item.url)}
          className="bg-fg/50 text-bg rounded px-1.5 text-xs"
        >
          Delete
        </button>
      </div>
      {item.type === "image" ? (
        <Image
          src={item.url}
          alt={item.altText || "media"}
          fill
          className="object-cover"
        />
      ) : (
        <video src={item.url} controls className="h-full w-full object-cover" />
      )}
      {editing ? (
        <div className="bg-fg/50 text-bg absolute right-1 bottom-1 left-1 flex flex-col gap-1 p-1">
          <Input
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setText(e.target.value)
            }
            className="bg-bg h-6 rounded text-xs"
            placeholder={item.type === "image" ? "Alt text" : "Title"}
          />
          <Input
            value={tagText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTagText(e.target.value)
            }
            className="bg-bg h-6 rounded text-xs"
            placeholder="Tags (comma separated)"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-fg rounded px-1 text-xs"
          >
            Save
          </button>
        </div>
      ) : item.altText || (item.tags && item.tags.length > 0) ? (
        <div className="bg-fg/50 text-bg absolute right-1 bottom-1 left-1 px-1 text-xs">
          {item.altText && item.type === "image" && <p>{item.altText}</p>}
          {item.tags && item.tags.length > 0 && <p>{item.tags.join(", ")}</p>}
        </div>
      ) : null}
    </div>
  );
}
