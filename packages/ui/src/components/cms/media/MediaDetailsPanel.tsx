// packages/ui/src/components/cms/media/MediaDetailsPanel.tsx
"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { MediaItem } from "@acme/types";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useId, useMemo, useState } from "react";

import { Spinner } from "../../atoms";
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
import { cn } from "../../../utils/style";
import { drawerWidthProps } from "../../../utils/style/drawerWidth";

interface MediaItemWithUrl extends MediaItem {
  url: string;
}

export interface MediaDetailsFormValues {
  title: string;
  altText: string;
  tags: string[];
}

export interface MediaDetailsPanelProps {
  open: boolean;
  item: MediaItemWithUrl;
  pending: boolean;
  onSubmit: (fields: MediaDetailsFormValues) => void | Promise<void>;
  onClose: () => void;
}

const PANEL_WIDTH = "28rem";

function tagsToString(value: MediaItem["tags"] | undefined): string {
  if (!value) return "";
  return value.filter(Boolean).join(", ");
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function getDefaultAlt(item: MediaItemWithUrl): string {
  return item.altText ?? item.title ?? "";
}

function getFileName(url: string): string {
  try {
    return decodeURIComponent(url.split("/").pop() ?? url);
  } catch {
    return url;
  }
}

export default function MediaDetailsPanel({
  open,
  item,
  pending,
  onSubmit,
  onClose,
}: MediaDetailsPanelProps): ReactElement {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const altId = `${baseId}-alt`;
  const tagsId = `${baseId}-tags`;
  const tagsHelpId = `${baseId}-tags-help`;

  const [title, setTitle] = useState<string>(() => item.title ?? "");
  const [altText, setAltText] = useState<string>(() => getDefaultAlt(item));
  const [tags, setTags] = useState<string>(() => tagsToString(item.tags));

  useEffect(() => {
    setTitle(item.title ?? "");
    setAltText(getDefaultAlt(item));
    setTags(tagsToString(item.tags));
  }, [item]);

  const fileName = useMemo(() => getFileName(item.url), [item.url]);
  const { widthClass, style } = drawerWidthProps(PANEL_WIDTH);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      title,
      altText,
      tags: parseTags(tags),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        style={style}
        className={cn(
          "bg-surface-3 fixed top-0 right-0 z-50 flex h-full max-w-full translate-x-full flex-col overflow-y-auto border-l border-border-2 p-6 shadow-elevation-4 transition-transform data-[state=open]:translate-x-0 [&>[data-radix-dialog-close]]:hidden left-auto translate-y-0", 
          widthClass
        )}
      >
        <Button
          type="button"
          variant="ghost"
          aria-label="Close details"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute right-4 top-4 h-9 w-9 p-0"
        >
          <Cross2Icon className="h-4 w-4" />
        </Button>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Edit media details</DialogTitle>
            <DialogDescription className="break-all text-left text-sm text-muted-foreground">
              Update metadata for {fileName}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto py-6">
            <div className="space-y-1">
              <label htmlFor={titleId} className="text-sm font-medium">
                Title
              </label>
              <Input
                id={titleId}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Add a title"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={altId} className="text-sm font-medium">
                Alt text
              </label>
              <Textarea
                id={altId}
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Describe the media for assistive technologies"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Alt text helps screen readers describe this media to people with
                low vision.
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor={tagsId} className="text-sm font-medium">
                Tags
              </label>
              <Input
                id={tagsId}
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="hero, campaign, summer"
                aria-describedby={tagsHelpId}
              />
              <p id={tagsHelpId} className="text-xs text-muted-foreground">
                Separate tags with commas, for example: hero, campaign,
                behind-the-scenes.
              </p>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button type="submit" disabled={pending} className="min-w-[120px]">
              {pending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  <span aria-live="polite" aria-atomic="true">
                    Saving…
                  </span>
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { MediaDetailsPanel };
