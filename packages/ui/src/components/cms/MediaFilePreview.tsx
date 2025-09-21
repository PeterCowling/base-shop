"use client";

import type { MediaItem } from "@acme/types";
import Image from "next/image";
import type { KeyboardEvent, ReactNode } from "react";

import { Progress, Tag } from "../atoms/shadcn";

interface MediaFilePreviewProps {
  item: MediaItem & { url: string };
  name: string;
  previewAlt?: string | null;
  previewLabel: string;
  actionsDisabled: boolean;
  onPreviewSelect?: () => void;
  onPreviewKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  isRecent: boolean;
  showReplacementOverlay: boolean;
  deleting: boolean;
  progressValue?: number;
  uploadError: string | null;
  children?: ReactNode;
}

export function MediaFilePreview({
  item,
  name,
  previewAlt,
  previewLabel,
  actionsDisabled,
  onPreviewSelect,
  onPreviewKeyDown,
  isRecent,
  showReplacementOverlay,
  deleting,
  progressValue,
  uploadError,
  children,
}: MediaFilePreviewProps) {
  return (
    <div className="relative">
      <div
        role={onPreviewSelect ? "button" : undefined}
        tabIndex={onPreviewSelect && !actionsDisabled ? 0 : undefined}
        onClick={onPreviewSelect && !actionsDisabled ? onPreviewSelect : undefined}
        onKeyDown={onPreviewKeyDown}
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

        {children}

        {showReplacementOverlay ? (
          <div
            className="bg-surface-1/90 text-center absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur"
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
            className="bg-surface-1/90 text-center absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur"
            data-token="--color-bg"
          >
            <p className="text-sm font-medium" data-token="--color-fg">
              Deleting asset...
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
