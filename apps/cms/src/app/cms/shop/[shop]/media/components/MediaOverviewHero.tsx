"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Button, Card, CardContent } from "@ui/components";
import {
  ArrowUpIcon,
  BarChartIcon,
  CardStackIcon,
  ImageIcon,
  VideoIcon,
} from "@radix-ui/react-icons";
import type {
  MediaPlanLimits,
  MediaRecentUpload,
} from "../../../../../../actions/media.server";

interface MediaOverviewHeroProps {
  shop: string;
  totalBytes: number;
  fileCount: number;
  recentUploads: MediaRecentUpload[];
  limits?: MediaPlanLimits | null;
  onUploadClick?: () => void;
}

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const precision = value < 10 && unit > 0 ? 1 : 0;
  return `${value.toFixed(precision)} ${SIZE_UNITS[unit]}`;
}

function fileNameFromUrl(url: string): string {
  const decoded = decodeURIComponent(url);
  const segments = decoded.split("/");
  return segments[segments.length - 1] || decoded;
}

export default function MediaOverviewHero({
  shop,
  totalBytes,
  fileCount,
  recentUploads,
  limits,
  onUploadClick,
}: MediaOverviewHeroProps) {
  const storageLimit = limits?.storageBytes ?? null;
  const assetLimit = limits?.assets ?? null;

  const numberFormatter = useMemo(() => new Intl.NumberFormat(undefined), []);
  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  const storageSummary = useMemo(() => {
    const primary = formatBytes(totalBytes);
    if (typeof storageLimit === "number" && storageLimit > 0) {
      const limitLabel = formatBytes(storageLimit);
      const percent = Math.min(
        100,
        Math.round((totalBytes / storageLimit) * 100)
      );
      return {
        primary,
        secondary: `${percent}% of ${limitLabel} available`,
      };
    }

    return {
      primary,
      secondary: "Across all uploaded assets",
    };
  }, [storageLimit, totalBytes]);

  const assetSummary = useMemo(() => {
    const primary = numberFormatter.format(fileCount);
    if (typeof assetLimit === "number" && assetLimit > 0) {
      const limitLabel = numberFormatter.format(assetLimit);
      const percent = Math.min(
        100,
        Math.round((fileCount / assetLimit) * 100)
      );
      return {
        primary,
        secondary: `${percent}% of ${limitLabel} assets allowed`,
      };
    }

    return {
      primary,
      secondary: `${fileCount === 1 ? "asset" : "assets"} in library`,
    };
  }, [assetLimit, fileCount, numberFormatter]);

  const uploads = recentUploads.slice(0, 5);

  return (
    <section
      aria-labelledby="media-overview-heading"
      className="space-y-4"
    >
      <Card>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2
                id="media-overview-heading"
                className="text-2xl font-semibold text-foreground"
              >
                Media – {shop}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track storage usage and quickly jump to recent uploads.
              </p>
            </div>
            <Button
              type="button"
              onClick={onUploadClick}
              disabled={!onUploadClick}
              className="inline-flex items-center gap-2"
            >
              <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
              Upload media
            </Button>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 p-4">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChartIcon className="h-4 w-4" aria-hidden="true" />
                Storage used
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">
                {storageSummary.primary}
              </dd>
              <p className="mt-1 text-sm text-muted-foreground">
                {storageSummary.secondary}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CardStackIcon className="h-4 w-4" aria-hidden="true" />
                Total assets
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">
                {assetSummary.primary}
              </dd>
              <p className="mt-1 text-sm text-muted-foreground">
                {assetSummary.secondary}
              </p>
            </div>
          </dl>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent uploads
            </h3>
            {uploads.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No uploads yet. Add your first asset to see it here.
              </p>
            ) : (
              <ul className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Recent uploads list">
                {uploads.map((upload) => {
                  const title = upload.title ?? upload.altText ?? fileNameFromUrl(upload.url);
                  const uploadedDate = new Date(upload.uploadedAt);
                  const formattedTimestamp = Number.isNaN(uploadedDate.getTime())
                    ? upload.uploadedAt
                    : timestampFormatter.format(uploadedDate);

                  return (
                    <li key={upload.url} className="min-w-[176px] flex-shrink-0">
                      <Card className="h-full">
                        <div className="flex h-full flex-col gap-3 p-3">
                          <div className="relative h-28 w-full overflow-hidden rounded-md bg-muted">
                            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs font-medium text-foreground shadow">
                              {upload.type === "video" ? (
                                <VideoIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              <span className="capitalize">{upload.type}</span>
                            </div>
                            {upload.type === "image" ? (
                              <Image
                                src={upload.url}
                                alt={title}
                                fill
                                sizes="176px"
                                className="h-full w-full object-cover"
                                priority={false}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-muted-foreground">
                                <VideoIcon className="h-8 w-8" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="truncate text-sm font-medium text-foreground" title={title}>
                              {title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <time dateTime={upload.uploadedAt}>{formattedTimestamp}</time>
                              {` • ${formatBytes(upload.bytes)}`}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
