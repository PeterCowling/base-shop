import * as React from "react";
import { cn } from "../../utils/style";

export type VideoPlayerProps = React.VideoHTMLAttributes<HTMLVideoElement>;

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ className, ...props }, ref) => (
    <video
      ref={ref}
      className={cn("w-full rounded-lg", className)}
      controls
      {...props}
    />
  )
);
VideoPlayer.displayName = "VideoPlayer";
