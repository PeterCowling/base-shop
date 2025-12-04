// packages/ui/src/components/cms/media/MediaDetailsPanel.tsx
"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { MediaItem } from "@acme/types";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
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
      <div className="relative">
        <DialogContent
          style={style}
          className={cn(
            "bg-panel fixed top-0 end-0 z-50 flex h-full w-full translate-x-full flex-col overflow-y-auto border-s border-border-2 p-6 shadow-elevation-4 transition-transform data-[state=open]:translate-x-0 [&>[data-radix-dialog-close]]:hidden start-auto translate-y-0", // i18n-exempt -- DS-000 class names [ttl=2026-01-01]
            widthClass
          )}
        >
          <Button
            type="button"
            variant="ghost"
            aria-label={String(t("actions.close"))}
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground absolute end-4 top-4 h-9 w-9 p-0"
          >
            <Cross2Icon className="h-4 w-4" />
          </Button>
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <DialogHeader className="space-y-2 text-start">
            <DialogTitle>{t("cms.media.details.editTitle")}</DialogTitle>
            <DialogDescription className="break-all text-start text-sm text-muted-foreground">
              {t("cms.media.details.updateMetaFor", { fileName })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto py-6">
            <div className="space-y-1">
              <label htmlFor={titleId} className="text-sm font-medium">
                {t("fields.title")}
              </label>
              <Input
                id={titleId}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={String(t("fields.title.add"))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={altId} className="text-sm font-medium">
                {t("cms.image.alt")}
              </label>
              <Textarea
                id={altId}
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder={String(t("cms.media.details.alt.placeholder"))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t("cms.media.details.alt.help")}
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor={tagsId} className="text-sm font-medium">
                {t("fields.tags")}
              </label>
              <Input
                id={tagsId}
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder={String(t("cms.media.details.tags.placeholder"))}
                aria-describedby={tagsHelpId}
              />
              <p id={tagsHelpId} className="text-xs text-muted-foreground">
                {t("cms.media.details.tags.help")}
              </p>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button
              type="submit"
              disabled={pending}
              aria-busy={pending || undefined}
              aria-label={pending ? (t("actions.saving") as string) : (t("actions.save") as string)}
              className={cn()}
              style={{ minWidth: 120 }}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" aria-hidden="true" />
                  <span aria-live="polite" aria-atomic="true">
                    {t("actions.saving")}
                  </span>
                </span>
              ) : (
                t("actions.save")
              )}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </div>
    </Dialog>
  );
}

export { MediaDetailsPanel };
