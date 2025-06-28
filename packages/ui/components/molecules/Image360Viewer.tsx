import * as React from "react";
import { cn } from "../../utils/cn";
import { ZoomImage } from "../atoms/ZoomImage";

export interface Image360ViewerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  frames: string[];
  alt?: string;
}

export const Image360Viewer = React.forwardRef<
  HTMLDivElement,
  Image360ViewerProps
>(({ frames, alt, className, ...props }, ref) => {
  const [index, setIndex] = React.useState(0);
  const startX = React.useRef<number | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 10) {
      setIndex(
        (prev) => (prev + (dx > 0 ? -1 : 1) + frames.length) % frames.length
      );
      startX.current = e.clientX;
    }
  }

  function onPointerUp() {
    startX.current = null;
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className={cn("touch-none", className)}
      {...props}
    >
      <ZoomImage
        src={frames[index]}
        alt={alt}
        fill
        className="rounded-lg object-cover"
      />
    </div>
  );
});
Image360Viewer.displayName = "Image360Viewer";
