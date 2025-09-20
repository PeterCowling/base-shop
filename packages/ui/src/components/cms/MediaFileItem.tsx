// packages/ui/components/cms/MediaFileItem.tsx
"use client";

import type { MediaItem } from "@acme/types";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { KeyboardEvent, ReactElement, useMemo, useRef } from "react";

import { Card, CardContent, Tag } from "../atoms/shadcn";
import { cn } from "../../utils/style";

import { MediaFileActions } from "./MediaFileActions";
import { MediaFilePreview } from "./MediaFilePreview";
import { useMediaReplacement } from "./useMediaReplacement";

interface Props {
  /**
   * The media item to render.  The generic {@link MediaItem} type marks the
   * `url` property as optional, but this component relies on it being present
   * (we can't display or replace a file without a URL).  Narrow the type here
   * to guarantee that `url` is a defined string throughout the component.
   */
  item: MediaItem & { url: string };
  shop: string;
  onDelete: (url: string) => void;
  onReplace: (oldUrl: string, item: MediaItem) => void;
  onSelect?: (item: MediaItem & { url: string } | null) => void;
  onBulkToggle?: (item: MediaItem & { url: string }, selected: boolean) => void;
  selectionEnabled?: boolean;
  selected?: boolean;
  deleting?: boolean;
  replacing?: boolean;
  disabled?: boolean;
  onReplaceSuccess?: (newItem: MediaItem) => void;
  onReplaceError?: (message: string) => void;
}

type FileSizeCandidate = MediaItem & { size?: unknown; fileSize?: unknown; sizeLabel?: unknown };

type FlaggedMediaItem = MediaItem & { isRecent?: boolean; flags?: string[] };

type ProgressMediaItem = MediaItem & {
  replaceProgress?: number;
  progress?: number;
  status?: string;
  isReplacing?: boolean;
};

function formatFileSize(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"] as const;
    const exponent = Math.min(
      Math.floor(Math.log(value) / Math.log(1024)),
      units.length - 1
    );
    const size = value / 1024 ** exponent;
    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[exponent]}`;
  }
  if (typeof value === "string" && value.trim().length > 0) return value;
  return null;
}

export default function MediaFileItem({
  item,
  shop: shopSlug,
  onDelete,
  onReplace,
  onSelect,
  onBulkToggle,
  selectionEnabled = false,
  selected = false,
  deleting = false,
  replacing = false,
  disabled = false,
  onReplaceSuccess,
  onReplaceError,
}: Props): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const name = useMemo(() => {
    try {
      return decodeURIComponent(item.url.split("/").pop() ?? item.url);
    } catch {
      return item.url;
    }
  }, [item.url]);

  // Cast through unknown to satisfy TS when converting a specific type to an indexable map
  const meta = item as unknown as Record<string, unknown>;
  const previewAlt =
    (typeof meta["altText"] === "string" && (meta["altText"] as string)) ||
    (typeof meta["alt"] === "string" && (meta["alt"] as string)) ||
    (typeof meta["title"] === "string" && (meta["title"] as string)) ||
    name;
  const tags = useMemo(() => {
    const raw = (item as unknown as Record<string, unknown>)["tags"];
    return Array.isArray(raw) ? (raw as unknown[]).filter((t): t is string => typeof t === "string") : [];
  }, [item]);

  const fileSize = useMemo(() => {
    const candidate = item as FileSizeCandidate;
    if ("size" in candidate) return formatFileSize(candidate.size);
    if ("fileSize" in candidate) return formatFileSize(candidate.fileSize);
    if ("sizeLabel" in candidate) return formatFileSize(candidate.sizeLabel);
    return null;
  }, [item]);

  const isRecent = useMemo(() => {
    const flagged = item as FlaggedMediaItem;
    if (flagged.isRecent) return true;
    if (Array.isArray(flagged.flags)) {
      return (flagged.flags ?? []).some((flag) => flag?.toLowerCase?.() === "recent");
    }
    return tags.some((tag) => tag?.toLowerCase?.() === "recent");
  }, [item, tags]);

  const externalProgress = useMemo(() => {
    const progressItem = item as ProgressMediaItem;
    if (typeof progressItem.replaceProgress === "number") {
      return progressItem.replaceProgress;
    }
    if (typeof progressItem.progress === "number") {
      return progressItem.progress;
    }
    return undefined;
  }, [item]);

  const externalReplacing = Boolean(
    (item as ProgressMediaItem).status === "replacing" || (item as ProgressMediaItem).isReplacing
  );

  const {
    uploading,
    uploadProgress,
    uploadError,
    handleFileChange,
  } = useMediaReplacement({
    item,
    shop: shopSlug,
    disabled,
    previewAlt,
    tags,
    onDelete,
    onReplace,
    onReplaceSuccess,
    onReplaceError,
  });

  const showReplacementOverlay = uploading || externalReplacing || replacing;
  const actionsDisabled = disabled || deleting || showReplacementOverlay;
  const deleteInProgress = deleting;
  const replaceInProgress = showReplacementOverlay && !deleting;
  const progressValue = uploading
    ? uploadProgress
    : typeof externalProgress === "number"
      ? externalProgress
      : undefined;

  const handleSelect = () => {
    if (actionsDisabled) return;
    onSelect?.(item);
  };

  const handlePreviewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (actionsDisabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item);
    }
  };

  const handleBulkToggle = (checked: CheckedState) => {
    if (actionsDisabled) return;
    onBulkToggle?.(item, checked === true || checked === "indeterminate");
  };

  const handleOpenDetails = () => {
    if (actionsDisabled) return;
    onSelect?.(item);
  };

  const handleSelectAction = () => {
    if (actionsDisabled) return;
    onSelect?.(item);
  };

  const handleReplaceRequest = () => {
    if (actionsDisabled) return;
    fileInputRef.current?.click();
  };

  const handleDeleteRequest = () => {
    if (actionsDisabled || deleteInProgress) return;
    onDelete(item.url);
  };

  const previewLabel =
    item.type === "video"
      ? `Video preview for ${previewAlt || name}`
      : `Image preview for ${previewAlt || name}`;

  const statusMessage = deleteInProgress ? "Deleting media…" : "Replacing media…";
  const actionsLoading = deleteInProgress || replaceInProgress;

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-border/60 transition focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        selected && "ring-2 ring-primary"
      )}
      data-selected={selected}
      data-deleting={deleting || undefined}
      data-replacing={showReplacementOverlay || undefined}
    >
      <MediaFilePreview
        item={item}
        name={name}
        previewAlt={previewAlt}
        previewLabel={previewLabel}
        actionsDisabled={actionsDisabled}
        onPreviewSelect={onSelect ? handleSelect : undefined}
        onPreviewKeyDown={handlePreviewKeyDown}
        isRecent={isRecent}
        showReplacementOverlay={showReplacementOverlay}
        deleting={deleting}
        progressValue={progressValue}
        uploadError={uploadError}
      >
        <MediaFileActions
          actionsDisabled={actionsDisabled}
          actionsLoading={actionsLoading}
          deleteInProgress={deleteInProgress}
          replaceInProgress={replaceInProgress}
          statusMessage={statusMessage}
          selectionEnabled={selectionEnabled}
          selected={selected}
          onBulkToggle={handleBulkToggle}
          onOpenDetails={onSelect ? handleOpenDetails : undefined}
          onSelectItem={onSelect ? handleSelectAction : undefined}
          onViewDetails={onSelect ? handleOpenDetails : undefined}
          onReplaceRequest={handleReplaceRequest}
          onDeleteRequest={handleDeleteRequest}
        />
      </MediaFilePreview>

      <CardContent className="flex flex-1 flex-col gap-2 border-t bg-muted/30 p-4" data-token="--color-muted">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg line-clamp-2" data-token="--color-fg">
              {item.title ?? name}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2" data-token="--color-muted-fg">
              {previewAlt}
            </p>
          </div>
          {fileSize ? <Tag className="shrink-0 whitespace-nowrap">{fileSize}</Tag> : null}
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        ) : null}
      </CardContent>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={actionsDisabled}
      />
    </Card>
  );
}
