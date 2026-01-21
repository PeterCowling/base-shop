import * as React from "react";

import { useTranslations } from "@acme/i18n";

import { cn } from "../utils/style";

export interface VideoPlayerProps
  extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /** Source URL for captions track (VTT). Required for accessible playback. */
  captionsSrc?: string;
  captionsLabel?: string;
  captionsLang?: string;
  fallbackText?: string;
}

const DEFAULT_CAPTIONS_LANG = "en"; // i18n-exempt -- UI-3001: language code default, not user-facing copy [ttl=2026-12-31]

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      className,
      captionsSrc,
      captionsLabel,
      captionsLang = DEFAULT_CAPTIONS_LANG,
      fallbackText,
      controls = true,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const t = useTranslations();
    const resolvedCaptionsLabel =
      captionsLabel ?? (t("video.captions.label") as string);
    const resolvedFallbackText =
      fallbackText ?? (t("video.captions.unavailable") as string);
    const resolvedAriaLabel =
      ariaLabel ?? props.title ?? (t("video.ariaLabel") as string);
    const hasProvidedCaptions = Boolean(captionsSrc);
    const resolvedCaptionsSrc =
      captionsSrc ??
      "data:text/vtt,WEBVTT"; // i18n-exempt -- UI-3001: fallback empty captions track for accessibility conformance [ttl=2026-12-31]
    const warningId = React.useId();

    return (
      <div className="flex w-full flex-col gap-2">
        <video
          ref={ref}
          className={cn("w-full rounded-lg", className)} // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
          data-aspect="16/9" // i18n-exempt -- UI-000: aspect ratio value; not user copy [ttl=2026-01-31]
          controls={controls}
          aria-label={resolvedAriaLabel}
          aria-describedby={!hasProvidedCaptions ? warningId : undefined}
          {...props}
        >
          <track
            kind="captions"
            src={resolvedCaptionsSrc}
            label={resolvedCaptionsLabel}
            srcLang={captionsLang}
          />
          {props.children}
        </video>
        {!hasProvidedCaptions ? (
          <p
            id={warningId}
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {resolvedFallbackText}
          </p>
        ) : null}
      </div>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";
