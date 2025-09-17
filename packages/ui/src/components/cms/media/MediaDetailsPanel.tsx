// packages/ui/src/components/cms/media/MediaDetailsPanel.tsx
"use client";

import type { MediaItem } from "@acme/types";
import Image from "next/image";
import { Button, Input, Textarea } from "../../atoms/shadcn";
import { Spinner } from "../../atoms";
import { FormEvent, ReactElement, useEffect, useMemo, useState } from "react";

type MetadataFields = {
  title?: string | null;
  altText?: string | null;
  tags?: string[] | null;
};

type WithUrl = MediaItem & { url: string };

interface MediaDetailsPanelProps {
  item: WithUrl | null;
  loading?: boolean;
  onSubmit: (fields: MetadataFields) => void | Promise<void>;
  onClose: () => void;
}

function parseInitialAltText(item: WithUrl | null): string {
  if (!item) return "";
  if (typeof item.altText === "string" && item.altText.length > 0) return item.altText;
  if (typeof (item as MediaItem & { alt?: unknown }).alt === "string") {
    return ((item as MediaItem & { alt?: string }).alt ?? "").toString();
  }
  if (typeof item.title === "string") return item.title;
  try {
    return decodeURIComponent(item.url.split("/").pop() ?? item.url);
  } catch {
    return item.url;
  }
}

export default function MediaDetailsPanel({
  item,
  loading = false,
  onSubmit,
  onClose,
}: MediaDetailsPanelProps): ReactElement | null {
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!item) {
      setTitle("");
      setAltText("");
      setTags("");
      return;
    }
    setTitle(typeof item.title === "string" ? item.title : "");
    setAltText(parseInitialAltText(item));
    const currentTags = Array.isArray(item.tags) ? item.tags : [];
    setTags(currentTags.join(", "));
  }, [item]);

  const previewAlt = useMemo(() => {
    if (!item) return "Media preview";
    return altText || item.title || item.url;
  }, [altText, item]);

  if (!item) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const normalizedAltText = altText.trim();
    const normalizedTags = tags
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    await onSubmit({
      title: normalizedTitle.length > 0 ? normalizedTitle : null,
      altText: normalizedAltText.length > 0 ? normalizedAltText : null,
      tags: normalizedTags,
    });
  };

  return (
    <aside
      className="bg-muted/30 border-border/60 rounded-lg border p-6"
      aria-label="Media details"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-28 overflow-hidden rounded-md bg-muted">
            <Image
              src={item.url}
              alt={previewAlt}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Media details</h2>
            <p className="text-xs text-muted-foreground break-all">{item.url}</p>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="media-details-title">
            Title
          </label>
          <Input
            id="media-details-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="media-details-alt">
            Alt text
          </label>
          <Textarea
            id="media-details-alt"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Describe the image for assistive technology"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="media-details-tags">
            Tags
          </label>
          <Input
            id="media-details-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Comma separated tags"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-w-[96px]"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="min-w-[120px]" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="h-4 w-4 animate-spin" />
                Saving
              </span>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </aside>
  );
}
