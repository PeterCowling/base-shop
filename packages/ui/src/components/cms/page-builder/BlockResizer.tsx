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
          className="absolute -top-5 left-1/2 -translate-x-1/2 group pointer-events-auto"
          onPointerDown={(e) => startRotate(e)}
          title="Rotate (Shift = precise)"
        >
          <div className="h-3 w-3 cursor-crosshair rounded-full bg-primary" />
          <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-black/60 px-1 text-[10px] text-white opacity-0 shadow transition-opacity duration-200 delay-200 group-hover:opacity-100 group-hover:delay-0 dark:bg-white/70 dark:text-black">
            Shift = precise
          </div>
        </div>
      )}
      <div onPointerDown={(e) => startResize(e, "nw")} className="bg-primary absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize" />
      <div onPointerDown={(e) => startResize(e, "ne")} className="bg-primary absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize" />
      <div onPointerDown={(e) => startResize(e, "sw")} className="bg-primary absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize" />
      <div onPointerDown={(e) => startResize(e, "se")} className="bg-primary absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize" />
      {/* Side handles */}
      <div onPointerDown={(e) => startResize(e, "n")} className="bg-primary absolute -top-1 left-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize" />
      <div onPointerDown={(e) => startResize(e, "s")} className="bg-primary absolute -bottom-1 left-1/2 h-2 w-3 -translate-x-1/2 cursor-ns-resize" />
      <div onPointerDown={(e) => startResize(e, "w")} className="bg-primary absolute top-1/2 -left-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize" />
      <div onPointerDown={(e) => startResize(e, "e")} className="bg-primary absolute top-1/2 -right-1 h-3 w-2 -translate-y-1/2 cursor-ew-resize" />
      <div
        onPointerDown={(e) => startSpacing(e, "margin", "top")}
        className="bg-primary absolute -top-2 left-1/2 h-1 w-4 -translate-x-1/2 cursor-n-resize"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "margin", "bottom")}
        className="bg-primary absolute -bottom-2 left-1/2 h-1 w-4 -translate-x-1/2 cursor-s-resize"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "margin", "left")}
        className="bg-primary absolute top-1/2 -left-2 h-4 w-1 -translate-y-1/2 cursor-w-resize"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "margin", "right")}
        className="bg-primary absolute top-1/2 -right-2 h-4 w-1 -translate-y-1/2 cursor-e-resize"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "padding", "top")}
        className="bg-primary absolute top-0 left-1/2 h-1 w-4 -translate-x-1/2 cursor-n-resize"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "padding", "bottom")}
        className="bg-primary absolute bottom-0 left-1/2 h-1 w-4 -translate-x-1/2 cursor-s-resize"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "padding", "left")}
        className="bg-primary absolute top-1/2 left-0 h-4 w-1 -translate-y-1/2 cursor-w-resize"
      />
      <div
        onPointerDown={(e) => startSpacing(e, "padding", "right")}
        className="bg-primary absolute top-1/2 right-0 h-4 w-1 -translate-y-1/2 cursor-e-resize"
      />
    </>
  );
}
