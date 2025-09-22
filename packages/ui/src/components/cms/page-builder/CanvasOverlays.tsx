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
    <>
      {/* Alignment guides + distances */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div
          className="bg-primary absolute top-0 bottom-0 w-px transition-opacity duration-150 motion-reduce:transition-none"
          style={{ left: guides.x ?? 0, opacity: guides.x !== null ? 1 : 0 }}
        />
        {distances.x !== null && (
          <div
            className="absolute -top-4 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow transition-opacity duration-150 motion-reduce:transition-none dark:bg-white/75 dark:text-black"
            style={{ left: (guides.x ?? 0) + 4, opacity: guides.x !== null ? 1 : 0 }}
          >
            {Math.round(distances.x)}
          </div>
        )}
        <div
          className="bg-primary absolute right-0 left-0 h-px transition-opacity duration-150 motion-reduce:transition-none"
          style={{ top: guides.y ?? 0, opacity: guides.y !== null ? 1 : 0 }}
        />
        {distances.y !== null && (
          <div
            className="absolute -left-4 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow transition-opacity duration-150 motion-reduce:transition-none dark:bg-white/75 dark:text-black"
            style={{ top: (guides.y ?? 0) + 4, opacity: guides.y !== null ? 1 : 0 }}
          >
            {Math.round(distances.y)}
          </div>
        )}
      </div>

      {/* Spacing overlay */}
      {spacingOverlay && (
        <div
          className="bg-primary/20 pointer-events-none absolute z-30"
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
        <div className="pointer-events-none absolute -top-5 left-0 z-30 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow dark:bg-white/75 dark:text-black">
          {Math.round(overlayWidth)}×{Math.round(overlayHeight)} px | {Math.round(overlayLeft)}, {Math.round(overlayTop)} px
        </div>
      )}

      {/* Rotation readout */}
      {rotating && (
        <div className="pointer-events-none absolute -top-8 left-1/2 z-30 -translate-x-1/2 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow dark:bg-white/75 dark:text-black">
          {Math.round(angle)}°
        </div>
      )}
    </>
  );
}
