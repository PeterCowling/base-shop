import * as React from "react";
import { cn } from "../../utils/style";

export type VideoPlayerProps = React.VideoHTMLAttributes<HTMLVideoElement>;

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ className, ...props }, ref) => (
    <video
      ref={ref}
      className={cn("w-full rounded-lg", className)} // i18n-exempt: class names
      data-aspect="16/9"
      controls
      {...props}
    />
  )
);
VideoPlayer.displayName = "VideoPlayer";
