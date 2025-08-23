import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const VideoPlayer = React.forwardRef(({ className, ...props }, ref) => (_jsx("video", { ref: ref, className: cn("w-full rounded-lg", className), controls: true, ...props })));
VideoPlayer.displayName = "VideoPlayer";
