// packages/ui/src/components/cms/blocks/VideoBlock.tsx
"use client";

import { useEffect, useRef } from "react";

import { VideoPlayer } from "@acme/design-system/atoms/VideoPlayer";

interface Props {
  /** Source URL of the video */
  src?: string;
  /** Whether the video should autoplay */
  autoplay?: boolean;
}

/** CMS wrapper for the VideoPlayer atom */
export default function VideoBlock({ src, autoplay }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && autoplay) {
      ref.current.setAttribute("muted", "");
    }
  }, [autoplay]);

  if (!src) return null;
  return (
    <VideoPlayer ref={ref} src={src} autoPlay={autoplay} muted={autoplay} />
  );
}
