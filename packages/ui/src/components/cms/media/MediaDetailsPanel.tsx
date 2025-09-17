// packages/ui/src/components/cms/media/MediaDetailsPanel.tsx
"use client";

import type { MediaItem } from "@acme/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from "../../atoms/shadcn";
import { useEffect, useMemo, useState } from "react";

export interface MediaDetailsValues {
  title: string;
  altText: string;
  description: string;
  tags: string[];
}

export interface MediaDetailsPanelProps {
  open: boolean;
  item: (MediaItem & { url: string }) | null;
  onClose: () => void;
  onSave: (values: MediaDetailsValues) => Promise<void> | void;
}

function formatTags(tags: readonly string[] | undefined): string {
  if (!tags || tags.length === 0) return "";
  return tags.join(", ");
}

function parseTags(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export default function MediaDetailsPanel({
  open,
  item,
  onClose,
  onSave,
}: MediaDetailsPanelProps) {
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mediaName = useMemo(() => {
    if (!item?.url) return "";
    try {
      return decodeURIComponent(item.url.split("/").pop() ?? item.url);
    } catch {
      return item.url;
    }
  }, [item?.url]);

  useEffect(() => {
    if (!open || !item) {
      setTitle("");
      setAltText("");
      setDescription("");
      setTags("");
      setError(null);
      setSaving(false);
      return;
    }

    setTitle(item.title ?? "");
    setAltText(item.altText ?? item.alt ?? "");
    setDescription((item as MediaItem & { description?: string }).description ?? "");
    setTags(formatTags(item.tags));
    setError(null);
    setSaving(false);
  }, [open, item]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const nextValues: MediaDetailsValues = {
      title: title.trim(),
      altText: altText.trim(),
      description: description.trim(),
      tags: parseTags(tags),
    };

    try {
      setSaving(true);
      await onSave(nextValues);
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to save changes");
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-xl space-y-6">
        <DialogHeader>
          <DialogTitle>Media details</DialogTitle>
          <DialogDescription>
            Update metadata for <strong>{mediaName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <fieldset className="space-y-2" disabled={saving}>
            <label className="block text-sm font-medium text-fg" htmlFor="media-title">
              Title
            </label>
            <Input
              id="media-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a descriptive title"
              required
            />
          </fieldset>

          <fieldset className="space-y-2" disabled={saving}>
            <label className="block text-sm font-medium text-fg" htmlFor="media-alt">
              Alt text
            </label>
            <Input
              id="media-alt"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Short description for screen readers"
            />
          </fieldset>

          <fieldset className="space-y-2" disabled={saving}>
            <label className="block text-sm font-medium text-fg" htmlFor="media-description">
              Description
            </label>
            <Textarea
              id="media-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional longer description"
              rows={3}
            />
          </fieldset>

          <fieldset className="space-y-2" disabled={saving}>
            <label className="block text-sm font-medium text-fg" htmlFor="media-tags">
              Tags
            </label>
            <Input
              id="media-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Comma separated tags"
            />
          </fieldset>

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
