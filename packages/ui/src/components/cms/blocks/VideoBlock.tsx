// packages/ui/src/components/cms/blocks/VideoBlock.tsx
"use client";

import { VideoPlayer } from "../../atoms/VideoPlayer";

interface Props {
  /** Source URL of the video */
  src?: string;
  /** Whether the video should autoplay */
  autoplay?: boolean;
}

/** CMS wrapper for the VideoPlayer atom */
export default function VideoBlock({ src, autoplay }: Props) {
  if (!src) return null;
  return <VideoPlayer src={src} autoPlay={autoplay} muted={autoplay} />;
}
