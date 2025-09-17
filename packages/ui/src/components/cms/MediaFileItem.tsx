// packages/ui/components/cms/MediaFileItem.tsx
"use client";

import type { ApiError, MediaItem } from "@acme/types";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import {
  KeyboardEvent,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Button,
  Card,
  CardContent,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Progress,
  Tag,
} from "../atoms/shadcn";
import { cn } from "../../utils/style";

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
}

type UploadTimer = ReturnType<typeof setInterval> | undefined;

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
  shop: _shop,
  onDelete,
  onReplace,
  onSelect,
  onBulkToggle,
  selectionEnabled = false,
  selected = false,
  deleting = false,
  replacing = false,
}: Props): ReactElement {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<UploadTimer>();

  const name = useMemo(() => {
    try {
      return decodeURIComponent(item.url.split("/").pop() ?? item.url);
    } catch {
      return item.url;
    }
  }, [item.url]);

  const previewAlt = item.altText || item.alt || item.title || name;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const fileSize = useMemo(() => {
    if ("size" in item) return formatFileSize((item as MediaItem & { size?: unknown }).size);
    if ("fileSize" in item)
      return formatFileSize((item as MediaItem & { fileSize?: unknown }).fileSize);
    if ("sizeLabel" in item)
      return formatFileSize((item as MediaItem & { sizeLabel?: unknown }).sizeLabel);
    return null;
  }, [item]);

  const isRecent = useMemo(() => {
    if ((item as MediaItem & { isRecent?: boolean }).isRecent) return true;
    if (Array.isArray((item as MediaItem & { flags?: string[] }).flags)) {
      return ((item as MediaItem & { flags?: string[] }).flags ?? []).some(
        (flag) => flag?.toLowerCase?.() === "recent"
      );
    }
    return tags.some((tag) => tag?.toLowerCase?.() === "recent");
  }, [item, tags]);

  const externalProgress = useMemo(() => {
    if (typeof (item as MediaItem & { replaceProgress?: number }).replaceProgress === "number") {
      return (item as MediaItem & { replaceProgress?: number }).replaceProgress;
    }
    if (typeof (item as MediaItem & { progress?: number }).progress === "number") {
      return (item as MediaItem & { progress?: number }).progress;
    }
    return undefined;
  }, [item]);

  const externalReplacing = Boolean(
    (item as MediaItem & { status?: string }).status === "replacing" ||
      (item as MediaItem & { isReplacing?: boolean }).isReplacing
  );

  const showReplacementOverlay = uploading || externalReplacing || replacing;
  const actionsDisabled = deleting || showReplacementOverlay;
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

  const clearTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = undefined;
    }
  };

  useEffect(() => clearTimer, []);

  const beginUploadProgress = () => {
    clearTimer();
    setUploadProgress(4);
    progressTimer.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 6;
      });
    }, 300);
  };

  const finishUploadProgress = () => {
    clearTimer();
    setUploadProgress(100);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    beginUploadProgress();
    let errorMessage: string | null = null;
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (previewAlt) fd.append("altText", previewAlt);
      if (tags.length > 0) fd.append("tags", JSON.stringify(tags));

      const response = await fetch(`/cms/api/media?shop=${_shop}`, {
        method: "POST",
        body: fd,
      });
      const data = (await response.json()) as MediaItem | ApiError;
      if (!response.ok || "error" in data) {
        throw new Error("Failed to upload replacement");
      }
      finishUploadProgress();
      await onDelete(item.url);
      onReplace(item.url, data);
    } catch (error) {
      clearTimer();
      setUploadProgress(0);
      errorMessage = (error as Error).message ?? "Replacement failed";
      setUploadError(errorMessage);
    } finally {
      const delay = errorMessage ? 2000 : 400;
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        if (errorMessage) setUploadError(null);
      }, delay);
    }
  };

  const handleBulkToggle = (checked: CheckedState) => {
    if (actionsDisabled) return;
    onBulkToggle?.(item, checked === true || checked === "indeterminate");
  };

  const handleOpenDetails = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (actionsDisabled) return;
    onSelect?.(item);
  };

  const handleReplaceRequest = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (actionsDisabled) return;
    fileInputRef.current?.click();
  };

  const previewLabel =
    item.type === "video"
      ? `Video preview for ${previewAlt || name}`
      : `Image preview for ${previewAlt || name}`;

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
      <div className="relative">
        <div
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect && !actionsDisabled ? 0 : undefined}
          onClick={onSelect && !actionsDisabled ? handleSelect : undefined}
          onKeyDown={handlePreviewKeyDown}
          className="relative aspect-[4/3] w-full overflow-hidden"
          aria-disabled={actionsDisabled || undefined}
        >
          {item.type === "video" ? (
            <video
              src={item.url}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              aria-label={previewLabel}
            />
          ) : (
            <Image
              src={item.url}
              alt={previewAlt || name}
              aria-label={previewLabel}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
          )}

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
            aria-hidden
          />

          {isRecent ? (
            <div className="absolute left-3 top-3 z-20">
              <Tag variant="success">Recent</Tag>
            </div>
          ) : null}

          {selectionEnabled ? (
            <div
              className="absolute left-3 top-3 z-20"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={selected}
                onCheckedChange={handleBulkToggle}
                aria-label={selected ? "Deselect media" : "Select media"}
                disabled={actionsDisabled}
              />
            </div>
          ) : null}

          <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 w-9 rounded-full p-0"
                  aria-label="Media actions"
                  onClick={(event) => event.stopPropagation()}
                  disabled={actionsDisabled}
                >
                  <DotsHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {onSelect ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      if (!actionsDisabled) onSelect(item);
                    }}
                    disabled={actionsDisabled}
                  >
                    View details
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onSelect={() => handleReplaceRequest()}
                  disabled={actionsDisabled}
                >
                  Replace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    if (!actionsDisabled) onDelete(item.url);
                  }}
                  disabled={actionsDisabled}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            {onSelect ? (
              <Button
                variant="outline"
                className="h-9 flex-1 rounded-md text-sm"
                onClick={handleOpenDetails}
                disabled={actionsDisabled}
              >
                Open details
              </Button>
            ) : null}
            {onSelect ? (
              <Button
                variant="ghost"
                className="h-9 rounded-md px-3 text-sm"
                onClick={(event) => {
                  event.stopPropagation();
                  if (actionsDisabled) return;
                  onSelect(item);
                }}
                disabled={actionsDisabled}
              >
                Select
              </Button>
            ) : null}
          </div>

          {showReplacementOverlay ? (
            <div
              className="bg-background/90 text-center absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur"
              data-token="--color-bg"
            >
              <Progress
                value={progressValue ?? 15}
                label={progressValue ? `${Math.round(progressValue)}%` : undefined}
                className="w-4/5 max-w-[200px]"
              />
              <p className="text-sm font-medium" data-token="--color-fg">
                Replacing asset...
              </p>
              {uploadError ? (
                <p className="text-xs text-danger" data-token="--color-danger">
                  {uploadError}
                </p>
              ) : null}
            </div>
          ) : null}

          {deleting && !showReplacementOverlay ? (
            <div
              className="bg-background/90 text-center absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur"
              data-token="--color-bg"
            >
              <p className="text-sm font-medium" data-token="--color-fg">
                Deleting asset...
              </p>
            </div>
          ) : null}
        </div>
      </div>

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
