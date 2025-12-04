"use client";

type Guides = { x: number | null; y: number | null };
type Distances = { x: number | null; y: number | null };

export type CanvasOverlaysProps = {
  guides: Guides;
  distances: Distances;
  spacingOverlay?: { top: number; left: number; width: number; height: number } | null;
  showSizePosition: boolean;
  overlayWidth: number;
  overlayHeight: number;
  overlayLeft: number;
  overlayTop: number;
  rotating: boolean;
  angle: number;
};

export default function CanvasOverlays({
  guides,
  distances,
  spacingOverlay,
  showSizePosition,
  overlayWidth,
  overlayHeight,
  overlayLeft,
  overlayTop,
  rotating,
  angle,
}: CanvasOverlaysProps) {
  return (
    <div className="relative">
      {/* Alignment guides + distances */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="bg-primary absolute top-0 bottom-0 w-px transition-opacity duration-150 motion-reduce:transition-none"
          // eslint-disable-next-line react/forbid-dom-props -- PB-0001: dynamic left/opacity required for alignment guide
          style={{ left: guides.x ?? 0, opacity: guides.x !== null ? 1 : 0 }}
        />
        {distances.x !== null && (
          <div
            className="absolute -top-4 rounded bg-foreground/75 px-1 font-mono text-xs text-foreground shadow transition-opacity duration-150 motion-reduce:transition-none dark:bg-card/75 dark:text-foreground"
            // eslint-disable-next-line react/forbid-dom-props -- PB-0001: dynamic positioning for distance label
            style={{ left: (guides.x ?? 0) + 4, opacity: guides.x !== null ? 1 : 0 }}
          >
            {Math.round(distances.x)}
          </div>
        )}
        <div
          className="bg-primary absolute end-0 start-0 h-px transition-opacity duration-150 motion-reduce:transition-none"
          // eslint-disable-next-line react/forbid-dom-props -- PB-0001: dynamic top/opacity required for alignment guide
          style={{ top: guides.y ?? 0, opacity: guides.y !== null ? 1 : 0 }}
        />
        {distances.y !== null && (
          <div
            className="absolute -left-4 rounded bg-foreground/75 px-1 font-mono text-xs text-foreground shadow transition-opacity duration-150 motion-reduce:transition-none dark:bg-card/75 dark:text-foreground"
            // eslint-disable-next-line react/forbid-dom-props -- PB-0001: dynamic positioning for distance label
            style={{ top: (guides.y ?? 0) + 4, opacity: guides.y !== null ? 1 : 0 }}
          >
            {Math.round(distances.y)}
          </div>
        )}
      </div>

      {/* Spacing overlay */}
      {spacingOverlay && (
        <div
          className="bg-primary/20 pointer-events-none absolute"
          // eslint-disable-next-line react/forbid-dom-props -- PB-0001: dynamic rect geometry (top/left/width/height) for spacing overlay
          style={{
            top: spacingOverlay.top,
            left: spacingOverlay.left,
            width: spacingOverlay.width,
            height: spacingOverlay.height,
          }}
        />
      )}

      {/* Size/position readout */}
      {showSizePosition && (
        <div className="pointer-events-none absolute -top-5 start-0 rounded bg-foreground/75 px-1 font-mono text-xs text-foreground shadow dark:bg-card/75 dark:text-foreground">
          {Math.round(overlayWidth)}×{Math.round(overlayHeight)} px | {Math.round(overlayLeft)}, {Math.round(overlayTop)} px
        </div>
      )}

      {/* Rotation readout */}
      {rotating && (
        <div className="pointer-events-none absolute -top-8 start-1/2 -translate-x-1/2 rounded bg-foreground/75 px-1 font-mono text-xs text-foreground shadow dark:bg-card/75 dark:text-foreground">
          {Math.round(angle)}°
        </div>
      )}
    </div>
  );
}
