"use client";

/* eslint-disable ds/container-widths-only-at, ds/no-hardcoded-copy -- UI-9999 [ttl=2026-12-31] retention UI pending i18n/layout cleanup */

import * as React from "react";
import useReducedMotion from "../../../../hooks/useReducedMotion";
import { cn } from "../../../../utils/style";

export interface MeasuringGuideAnimationProps
  extends React.HTMLAttributes<HTMLDivElement> {
  caption: string;
  description: string;
}

export function MeasuringGuideAnimation({
  caption,
  description,
  className,
  ...props
}: MeasuringGuideAnimationProps) {
  const prefersReducedMotion = useReducedMotion();
  const descriptionId = React.useId();

  return (
    <figure
      className={cn(
        "rounded-3xl border border-border-1 bg-surface-2 p-4", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className,
      )}
      {...props}
    >
      <div
        className="mx-auto flex max-w-sm flex-col items-center gap-3"
        aria-describedby={descriptionId}
      >
        <div className="w-full overflow-hidden rounded-2xl border border-border-1 bg-surface-1 p-4">
          <svg
            viewBox="0 0 240 140"
            role="img"
            aria-labelledby={descriptionId}
            className="h-32 w-full"
          >
            <title id={descriptionId}>{description}</title>
            <rect x="0" y="0" width="240" height="140" fill="transparent" />
            {/* head */}
            <circle cx="120" cy="70" r="46" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.75" />
            {/* ears */}
            <circle cx="74" cy="72" r="8" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.65" />
            <circle cx="166" cy="72" r="8" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.65" />
            {/* tape path */}
            <ellipse
              cx="120"
              cy="72"
              rx="68"
              ry="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="10 10"
              opacity="0.9"
            >
              {!prefersReducedMotion ? (
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;20"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              ) : null}
            </ellipse>
            {/* tape marker */}
            <circle cx="120" cy="20" r="6" fill="currentColor" opacity="0.9" />
          </svg>
        </div>

        <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>
      </div>
    </figure>
  );
}
