"use client";

interface Props {
  selected: boolean;
  startResize: (e: React.PointerEvent, handle?: "se" | "ne" | "sw" | "nw" | "e" | "w" | "n" | "s") => void;
  startSpacing: (
    e: React.PointerEvent,
    type: "margin" | "padding",
    side: "top" | "bottom" | "left" | "right",
  ) => void;
  startRotate?: (e: React.PointerEvent) => void;
}

export default function BlockResizer({
  selected,
  startResize,
  startSpacing,
  startRotate,
}: Props) {
  if (!selected) return null;
  return (
    <>
      {/* Rotate handle (top-center, slightly offset above) */}
      {startRotate && (
        <div
          className="absolute -top-7 start-1/2 -translate-x-1/2 group pointer-events-auto"
          onPointerDown={(e) => startRotate(e)}
          title="Rotate (Shift = precise)"
          role="button"
          tabIndex={0}
          aria-label="Rotate block"
        >
          <div className="h-6 w-6 cursor-crosshair rounded-full bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          <div className="pointer-events-none absolute -top-7 start-1/2 -translate-x-1/2 rounded bg-black/60 px-1 text-[10px] text-white opacity-0 shadow transition-opacity duration-200 delay-200 group-hover:opacity-100 group-hover:delay-0 dark:bg-white/70 dark:text-black">
            Shift = precise
          </div>
        </div>
      )}
      <div onPointerDown={(e) => startResize(e, "nw")} role="button" tabIndex={0} aria-label="Resize from top-left" className="bg-primary absolute -top-2 -start-2 h-6 w-6 cursor-nwse-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <div onPointerDown={(e) => startResize(e, "ne")} role="button" tabIndex={0} aria-label="Resize from top-right" className="bg-primary absolute -top-2 -end-2 h-6 w-6 cursor-nesw-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <div onPointerDown={(e) => startResize(e, "sw")} role="button" tabIndex={0} aria-label="Resize from bottom-left" className="bg-primary absolute -bottom-2 -start-2 h-6 w-6 cursor-nesw-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <div onPointerDown={(e) => startResize(e, "se")} role="button" tabIndex={0} aria-label="Resize from bottom-right" className="bg-primary absolute -end-2 -bottom-2 h-6 w-6 cursor-nwse-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      {/* Side handles */}
      <div onPointerDown={(e) => startResize(e, "n")} role="button" tabIndex={0} aria-label="Resize from top" className="bg-primary absolute -top-2 start-1/2 h-6 w-8 -translate-x-1/2 cursor-ns-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <div onPointerDown={(e) => startResize(e, "s")} role="button" tabIndex={0} aria-label="Resize from bottom" className="bg-primary absolute -bottom-2 start-1/2 h-6 w-8 -translate-x-1/2 cursor-ns-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <div onPointerDown={(e) => startResize(e, "w")} role="button" tabIndex={0} aria-label="Resize from left" className="bg-primary absolute top-1/2 -start-2 h-8 w-6 -translate-y-1/2 cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <div onPointerDown={(e) => startResize(e, "e")} role="button" tabIndex={0} aria-label="Resize from right" className="bg-primary absolute top-1/2 -end-2 h-8 w-6 -translate-y-1/2 cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <div
        onPointerDown={(e) => startSpacing(e, "margin", "top")}
        role="button"
        tabIndex={0}
        aria-label="Adjust margin top"
        className="bg-primary absolute -top-3 start-1/2 h-2 w-10 -translate-x-1/2 cursor-n-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "margin", "bottom")}
        role="button"
        tabIndex={0}
        aria-label="Adjust margin bottom"
        className="bg-primary absolute -bottom-3 start-1/2 h-2 w-10 -translate-x-1/2 cursor-s-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "margin", "left")}
        role="button"
        tabIndex={0}
        aria-label="Adjust margin left"
        className="bg-primary absolute top-1/2 -left-3 h-10 w-2 -translate-y-1/2 cursor-w-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "margin", "right")}
        role="button"
        tabIndex={0}
        aria-label="Adjust margin right"
        className="bg-primary absolute top-1/2 -right-3 h-10 w-2 -translate-y-1/2 cursor-e-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "padding", "top")}
        role="button"
        tabIndex={0}
        aria-label="Adjust padding top"
        className="bg-primary absolute -top-1 start-1/2 h-2 w-10 -translate-x-1/2 cursor-n-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "padding", "bottom")}
        role="button"
        tabIndex={0}
        aria-label="Adjust padding bottom"
        className="bg-primary absolute -bottom-1 start-1/2 h-2 w-10 -translate-x-1/2 cursor-s-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "padding", "left")}
        role="button"
        tabIndex={0}
        aria-label="Adjust padding left"
        className="bg-primary absolute top-1/2 -left-1 h-10 w-2 -translate-y-1/2 cursor-w-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "padding", "right")}
        role="button"
        tabIndex={0}
        aria-label="Adjust padding right"
        className="bg-primary absolute top-1/2 -end-1 h-10 w-2 -translate-y-1/2 cursor-e-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </>
  );
}
