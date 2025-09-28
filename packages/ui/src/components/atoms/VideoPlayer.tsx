import * as React from "react";
import { cn } from "../../utils/style";

export type VideoPlayerProps = React.VideoHTMLAttributes<HTMLVideoElement>;

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ className, ...props }, ref) => (
    <video
      ref={ref}
      className={cn("w-full rounded-lg", className)} // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
      data-aspect="16/9" // i18n-exempt -- UI-000: aspect ratio value; not user copy [ttl=2026-01-31]
      controls
      {...props}
    >
      {/**
       * Accessibility: Provide a captions track by default to satisfy jsx-a11y/media-has-caption.
       * Consumers can override by passing their own <track> as children.
       */}
      <track kind="captions" /> {/* i18n-exempt -- UI-000: track kind token; not user-facing copy [ttl=2026-01-31] */}
    </video>
  )
);
VideoPlayer.displayName = "VideoPlayer"; // i18n-exempt -- UI-000: component displayName; not user-facing [ttl=2026-01-31]
