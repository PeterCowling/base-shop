"use client";

import Image from "next/image";
import { useCallback } from "react";
import type { MediaItem } from "@acme/types";
import {
  Button,
  Card,
  CardContent,
  Progress,
} from "@/components/atoms/shadcn";
import {
  ClockIcon,
  ImageIcon,
  StackIcon,
  UploadIcon,
  VideoIcon,
} from "@radix-ui/react-icons";
import { Inline } from "@ui/components/atoms/primitives";
import { useTranslations } from "@acme/i18n";

interface MediaOverviewHeroProps {
  shop: string;
  totalBytes: number;
  assetCount: number;
  recentUploads: MediaItem[];
  uploaderTargetId?: string;
  storageLimitBytes?: number | null;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / 1024 ** exponent;
  const precision = size >= 10 || exponent === 0 ? 0 : 1;

  return `${size.toFixed(precision)} ${units[exponent]}`;
}

function formatTimestamp(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDisplayName(item: MediaItem): string {
  if (item.title && item.title.trim().length > 0) {
    return item.title;
  }

  if (item.altText && item.altText.trim().length > 0) {
    return item.altText;
  }

  try {
    const decoded = decodeURIComponent(item.url.split("/").pop() ?? item.url);
    return decoded || item.url;
  } catch {
    return item.url;
  }
}

export default function MediaOverviewHero({
  shop,
  totalBytes,
  assetCount,
  recentUploads,
  uploaderTargetId,
  storageLimitBytes,
}: MediaOverviewHeroProps) {
  const t = useTranslations();
  const usagePercent =
    typeof storageLimitBytes === "number" && storageLimitBytes > 0
      ? Math.min(100, Math.round((totalBytes / storageLimitBytes) * 100))
      : null;
  const storageSummary =
    typeof storageLimitBytes === "number" && storageLimitBytes > 0
      ? `${formatBytes(totalBytes)} of ${formatBytes(storageLimitBytes)}`
      : formatBytes(totalBytes);

  const mostRecentUpload = recentUploads[0];
  const headingId = "media-overview-heading";

  const handleUploadClick = useCallback(() => {
    if (!uploaderTargetId) return;

    const element = document.getElementById(uploaderTargetId);
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus({ preventScroll: true });
    }
  }, [uploaderTargetId]);

  return (
    <section aria-labelledby={headingId} role="region">
      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("cms.media.overview.tag", { shop })}
              </p>
              <h1 id={headingId} className="text-2xl font-semibold">
                {t("cms.media.overview.heading")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("cms.media.overview.subheading")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleUploadClick}
                className="inline-flex items-center gap-2"
              >
                <UploadIcon className="h-4 w-4" aria-hidden />
                {t("cms.media.overview.cta.upload")}
              </Button>
            </div>
          </div>

          <dl
            className="grid gap-4 sm:grid-cols-3"
            aria-label={String(t("cms.media.overview.stats.aria"))}
          >
            <div className="rounded-lg border border-border-3 bg-surface-3 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <StackIcon className="h-4 w-4" aria-hidden />
                {t("cms.media.overview.storage.used")}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-foreground">
                {storageSummary}
              </dd>
              {usagePercent !== null && (
                <div className="mt-4 space-y-1">
                  <Progress
                    value={usagePercent}
                    aria-label={String(t("cms.media.overview.storage.aria"))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("cms.media.overview.storage.planCapacity", {
                      percent: usagePercent,
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border-3 bg-surface-3 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ImageIcon className="h-4 w-4" aria-hidden />
                {t("cms.media.overview.assets.label")}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-foreground">
                {assetCount.toLocaleString()}
              </dd>
              <p className="text-xs text-muted-foreground">
                {t("cms.media.overview.assets.caption")}
              </p>
            </div>

            <div className="rounded-lg border border-border-3 bg-surface-3 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ClockIcon className="h-4 w-4" aria-hidden />
                {t("cms.media.overview.lastUpload.label")}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-foreground">
                {mostRecentUpload
                  ? formatTimestamp(
                      mostRecentUpload.uploadedAt,
                      String(t("cms.media.timeUnavailable"))
                    )
                  : String(t("cms.media.overview.lastUpload.none"))}
              </dd>
              {mostRecentUpload && (
                <p className="text-xs text-muted-foreground">
                  {getDisplayName(mostRecentUpload)}
                </p>
              )}
            </div>
          </dl>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {t("cms.media.overview.recent.heading")}
            </h2>
            {recentUploads.length > 0 ? (
              <Inline
                role="list"
                className="overflow-x-auto pb-2"
                aria-label={String(t("cms.media.overview.recent.aria"))}
                alignY="start"
                gap={4}
                wrap={false}
              >
                {recentUploads.map((item) => {
                  const name = getDisplayName(item);
                  const timestamp = formatTimestamp(
                    item.uploadedAt,
                    String(t("cms.media.timeUnavailable"))
                  );

                  return (
                    <div
                      role="listitem"
                      key={item.url}
                      className="min-w-44 shrink-0"
                    >
                      <div className="space-y-2">
                        <div className="relative h-28 w-full overflow-hidden rounded-md border border-border-3 bg-muted">
                          {item.url ? (
                            <Image
                              src={item.url}
                              alt={name}
                              width={160}
                              height={160}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-6 w-6" aria-hidden />
                            </div>
                          )}
                          {item.type === "video" && (
                            <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-foreground/60 px-2 py-1 text-xs text-primary-foreground">
                              <VideoIcon className="h-3 w-3" aria-hidden />
                              {t("media.video")}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {name}
                          </p>
                          <p className="text-xs text-muted-foreground">{timestamp}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Inline>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("cms.media.overview.empty")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
