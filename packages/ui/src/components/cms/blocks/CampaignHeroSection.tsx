"use client";

import * as React from "react";
import CountdownTimer from "./CountdownTimer";
import type { LookbookHotspot } from "./Lookbook";
import ExperimentGate from "../../ab/ExperimentGate";
import { parseTargetDate, getTimeRemaining } from "@acme/date-utils";

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
      <div className="relative mx-auto max-w-7xl">
        {/* Media */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded">
          {mediaType === "video" && videoSrc ? (
            <video
              className="h-full w-full object-cover"
              playsInline
              autoPlay
              muted
              loop
              poster={videoPoster}
            >
              <source src={videoSrc} />
            </video>
          ) : imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt={imageAlt ?? ""} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-200" />
          )}

          {/* Hotspots */}
          {Array.isArray(hotspots) && hotspots.length > 0 && (
            <ExperimentGate flag={experimentKey ? `${experimentKey}:hotspots` : undefined}>
              {hotspots.map((p, i) => (
                <a
                  key={i}
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  href={p.sku ? `/p/${encodeURIComponent(p.sku)}` : undefined}
                  title={p.sku}
                />
              ))}
            </ExperimentGate>
          )}
        </div>

        {/* Countdown + USPs */}
        <div className="mt-4 flex flex-col items-center gap-4">
          {countdownTarget ? (
            <CountdownTimer targetDate={countdownTarget} timezone={timezone} styles="text-lg font-medium" />
          ) : null}
          {usps.length > 0 ? (
            <ul className="grid w-full grid-cols-1 gap-2 text-center text-sm text-neutral-700 sm:grid-cols-3">
              {usps.map((u, i) => (
                <li key={i} className="rounded border px-3 py-2">{u}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

