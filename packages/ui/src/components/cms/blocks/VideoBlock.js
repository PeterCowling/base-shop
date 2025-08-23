// packages/ui/src/components/cms/blocks/VideoBlock.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { VideoPlayer } from "../../atoms/VideoPlayer";
/** CMS wrapper for the VideoPlayer atom */
export default function VideoBlock({ src, autoplay }) {
    if (!src)
        return null;
    return _jsx(VideoPlayer, { src: src, autoPlay: autoplay, muted: autoplay });
}
