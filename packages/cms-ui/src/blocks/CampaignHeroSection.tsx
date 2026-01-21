"use client";

import * as React from "react";

import { getTimeRemaining,parseTargetDate } from "@acme/date-utils";

import ExperimentGate from "../../ab/ExperimentGate";
import { Grid as GridPrimitive } from "../../atoms/primitives/Grid";
import { Stack } from "../../atoms/primitives/Stack";

import { Image as DSImage } from "./atoms";
import CountdownTimer from "./CountdownTimer";
import type { LookbookHotspot } from "./Lookbook";

export interface CampaignHeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  mediaType?: "image" | "video";
  imageSrc?: string;
  imageAlt?: string;
  videoSrc?: string;
  videoPoster?: string;
  /** Optional strip of short USPs rendered below the media */
  usps?: string[];
  /** Optional hotspots (dot overlays) referencing products */
  hotspots?: LookbookHotspot[];
  /** Optional countdown target (ISO or date string) */
  countdownTarget?: string;
  timezone?: string;
  /** Post-expiry behavior */
  onExpire?: "hide" | "swap";
  /** Section id to swap to when expired (handled by page shell) */
  swapSectionId?: string;
  /** Experiment key to gate this section or sub-elements */
  experimentKey?: string;
}

export default function CampaignHeroSection({
  mediaType = "image",
  imageSrc,
  imageAlt,
  videoSrc,
  videoPoster,
  usps = [],
  hotspots = [],
  countdownTarget,
  timezone,
  onExpire = "hide",
  swapSectionId,
  experimentKey,
  className,
  ...rest
}: CampaignHeroSectionProps) {
  const target = React.useMemo(() => parseTargetDate(countdownTarget, timezone), [countdownTarget, timezone]);
  const expired = React.useMemo(() => {
    if (!target) return false;
    return getTimeRemaining(target) <= 0;
  }, [target]);

  if (expired) {
    if (onExpire === "swap" && swapSectionId) {
      return <div data-swap-section-id={swapSectionId} />;
    }
    return null;
  }

  return (
    <section className={["relative", className].filter(Boolean).join(" ") || undefined} {...rest}>
      <div className="relative mx-auto">
        {/* Media */}
        <div className="relative w-full overflow-hidden rounded">
          {mediaType === "video" && videoSrc ? (
            <div className="aspect-video">
              <video
                className="h-full w-full object-cover"
                data-aspect="16/9"
                playsInline
                autoPlay
                muted
                loop
                poster={videoPoster}
              >
                <source src={videoSrc} />
              </video>
            </div>
          ) : imageSrc ? (
            <DSImage src={imageSrc} alt={imageAlt ?? ""} cropAspect="16:9" sizes="100vw" />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}

          {/* Hotspots */}
          {Array.isArray(hotspots) && hotspots.length > 0 && (
            <ExperimentGate flag={experimentKey ? `${experimentKey}:hotspots` : undefined}>
              <svg className="absolute inset-0" aria-hidden="true">
                {hotspots.map((p) => (
                  <a
                    key={`${p.sku ?? "hotspot"}-${p.x}-${p.y}`}
                    href={p.sku ? `/p/${encodeURIComponent(p.sku)}` : undefined}
                    title={p.sku}
                  >
                    <circle
                      cx={`${p.x}%`}
                      cy={`${p.y}%`}
                      r={6}
                      className="fill-primary drop-shadow-sm"
                    />
                  </a>
                ))}
              </svg>
            </ExperimentGate>
          )}
        </div>

        {/* Countdown + USPs */}
        <Stack className="mt-4" gap={4} align="center">
          {countdownTarget ? (
            // i18n-exempt -- ABC-123 [ttl=2026-03-31] style utility string, not user-facing copy
            <CountdownTimer targetDate={countdownTarget} timezone={timezone} styles="text-lg font-medium" />
          ) : null}
          {usps.length > 0 ? (
            <GridPrimitive className="w-full text-center text-sm text-muted-foreground sm:grid-cols-3" cols={1} gap={2}>
              <ul className="contents">
                {usps.map((u) => (
                  <li key={u} className="rounded border px-3 py-2 bg-card text-foreground">
                    {u}
                  </li>
                ))}
              </ul>
            </GridPrimitive>
          ) : null}
        </Stack>
      </div>
    </section>
  );
}
