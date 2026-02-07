"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useCallback } from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";
import type { MediaItem } from "@acme/types";

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
  const t = useTranslations();
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] responsive image sizes string
  const IMAGE_SIZES_SM = "(min-width: 768px) 25vw, 50vw";
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onPreviewKeyDown?.(event);
      if (!onPreviewSelect || actionsDisabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onPreviewSelect();
      }
    },
    [onPreviewKeyDown, onPreviewSelect, actionsDisabled],
  );
  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={onPreviewSelect && !actionsDisabled ? 0 : -1}
        onClick={onPreviewSelect && !actionsDisabled ? onPreviewSelect : undefined}
        onKeyDown={handleKeyDown}
        className="relative aspect-video w-full overflow-hidden"
        aria-disabled={actionsDisabled || undefined}
      >
        {item.type === "video" ? (
          <video
            src={item.url}
            className="h-full w-full object-cover"
            data-aspect="16/9"
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
            sizes={IMAGE_SIZES_SM}
            className="object-cover"
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
          aria-hidden
        />

        {isRecent ? (
          <div className="absolute start-3 top-3">
            <Tag variant="success">{t("cms.media.recent")}</Tag>
          </div>
        ) : null}

        {children}

        {showReplacementOverlay ? (
          <div
            className="bg-surface-1/90 text-center absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur"
            data-token="--color-bg"
          >
            <Progress
              value={progressValue ?? 15}
              label={progressValue ? `${Math.round(progressValue)}%` : undefined}
              className="w-52 sm:w-64"
            />
            <p className="text-sm font-medium" data-token="--color-fg">
              {t("cms.media.replacing")}
            </p>
            {uploadError ? (
              // i18n-exempt -- ABC-123 upstream error string shown verbatim [ttl=2026-01-31]
              <p className="text-xs text-danger" data-token="--color-danger">
                {uploadError}
              </p>
            ) : null}
          </div>
        ) : null}

        {deleting && !showReplacementOverlay ? (
          <div
            className="bg-surface-1/90 text-center absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur"
            data-token="--color-bg"
          >
            <p className="text-sm font-medium" data-token="--color-fg">
              {t("cms.media.deleting")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
