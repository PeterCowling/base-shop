"use client";

interface Props {
  selected: boolean;
  startResize: (e: React.PointerEvent) => void;
  startSpacing: (
    e: React.PointerEvent,
    type: "margin" | "padding",
    side: "top" | "bottom" | "left" | "right",
  ) => void;
}

export default function BlockResizer({
  selected,
  startResize,
  startSpacing,
}: Props) {
  if (!selected) return null;
  return (
    <>
      <div
        onPointerDown={startResize}
        className="bg-primary absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize"
      />
      <div
        onPointerDown={startResize}
        className="bg-primary absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize"
      />
      <div
        onPointerDown={startResize}
        className="bg-primary absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize"
      />
      <div
        onPointerDown={startResize}
        className="bg-primary absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize"
      />
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

