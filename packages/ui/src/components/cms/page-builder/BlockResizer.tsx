"use client";

/* eslint-disable ds/no-hardcoded-copy -- UI-1420 [ttl=2025-12-31]: aria labels and helper text for resize handles are editor-only controls */
import { useTranslations } from "@acme/i18n";
import type { PointerEvent } from "react";

type ResizeHandle = "se" | "ne" | "sw" | "nw" | "e" | "w" | "n" | "s";
type SpacingType = "margin" | "padding";
type SpacingSide = "top" | "bottom" | "left" | "right";

interface Props {
  selected: boolean;
  startResize: (e: PointerEvent, handle?: ResizeHandle) => void;
  startSpacing: (e: PointerEvent, type: SpacingType, side: SpacingSide) => void;
  startRotate?: (e: PointerEvent) => void;
}

const cornerHandles: Array<{
  handle: ResizeHandle;
  className: string;
  ariaLabel: string;
}> = [
  {
    handle: "nw",
    className:
      "pointer-events-auto absolute -top-2 -start-2 h-6 w-6 cursor-nwse-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Resize from top-left",
  },
  {
    handle: "ne",
    className:
      "pointer-events-auto absolute -top-2 -end-2 h-6 w-6 cursor-nesw-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Resize from top-right",
  },
  {
    handle: "sw",
    className:
      "pointer-events-auto absolute -bottom-2 -start-2 h-6 w-6 cursor-nesw-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Resize from bottom-left",
  },
  {
    handle: "se",
    className:
      "pointer-events-auto absolute -end-2 -bottom-2 h-6 w-6 cursor-nwse-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Resize from bottom-right",
  },
];

const edgeHandles: Array<{
  handle: ResizeHandle;
  className: string;
  ariaLabel: string;
}> = [
  {
    handle: "n",
    className:
      "pointer-events-auto absolute -top-2 start-1/2 h-6 w-8 -translate-x-1/2 cursor-ns-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Resize from top",
  },
  {
    handle: "s",
    className:
      "pointer-events-auto absolute -bottom-2 start-1/2 h-6 w-8 -translate-x-1/2 cursor-ns-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Resize from bottom",
  },
  {
    handle: "w",
    className:
      "pointer-events-auto absolute top-1/2 -start-2 h-8 w-6 -translate-y-1/2 cursor-ew-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Resize from left",
  },
  {
    handle: "e",
    className:
      "pointer-events-auto absolute top-1/2 -end-2 h-8 w-6 -translate-y-1/2 cursor-ew-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Resize from right",
  },
];

const spacingHandles: Array<{
  type: SpacingType;
  side: SpacingSide;
  className: string;
  ariaLabel: string;
}> = [
  {
    type: "margin",
    side: "top",
    className:
      "pointer-events-auto absolute -top-3 start-1/2 h-2 w-10 -translate-x-1/2 cursor-n-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Adjust margin top",
  },
  {
    type: "margin",
    side: "bottom",
    className:
      "pointer-events-auto absolute -bottom-3 start-1/2 h-2 w-10 -translate-x-1/2 cursor-s-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Adjust margin bottom",
  },
  {
    type: "margin",
    side: "left",
    className:
      "pointer-events-auto absolute top-1/2 -left-3 h-10 w-2 -translate-y-1/2 cursor-w-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Adjust margin left",
  },
  {
    type: "margin",
    side: "right",
    className:
      "pointer-events-auto absolute top-1/2 -right-3 h-10 w-2 -translate-y-1/2 cursor-e-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Adjust margin right",
  },
  {
    type: "padding",
    side: "top",
    className:
      "pointer-events-auto absolute -top-1 start-1/2 h-2 w-10 -translate-x-1/2 cursor-n-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Adjust padding top",
  },
  {
    type: "padding",
    side: "bottom",
    className:
      "pointer-events-auto absolute -bottom-1 start-1/2 h-2 w-10 -translate-x-1/2 cursor-s-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Adjust padding bottom",
  },
  {
    type: "padding",
    side: "left",
    className:
      "pointer-events-auto absolute top-1/2 -left-1 h-10 w-2 -translate-y-1/2 cursor-w-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Adjust padding left",
  },
  {
    type: "padding",
    side: "right",
    className:
      "pointer-events-auto absolute top-1/2 -end-1 h-10 w-2 -translate-y-1/2 cursor-e-resize bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    ariaLabel: "Adjust padding right",
  },
];

const interactiveHandleProps = {
  role: "button" as const,
  tabIndex: 0,
};

export default function BlockResizer({
  selected,
  startResize,
  startSpacing,
  startRotate,
}: Props) {
  const t = useTranslations();

  if (!selected) return null;

  return (
    <div className="relative">
      {startRotate && (
        <div
          className="absolute -top-7 start-1/2 -translate-x-1/2 pointer-events-auto"
          onPointerDown={(event) => startRotate(event)}
          title={String(t("Rotate (Shift = precise)"))}
          aria-label="Rotate block"
          {...interactiveHandleProps}
        >
          <div className="group relative">
            <div className="h-6 w-6 cursor-crosshair rounded-full bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            <div className="pointer-events-none absolute -top-7 start-1/2 -translate-x-1/2 rounded bg-foreground/60 px-1 text-xs text-foreground opacity-0 shadow transition-opacity duration-200 delay-200 group-hover:opacity-100 group-hover:delay-0 dark:bg-card/70 dark:text-foreground">
              {t("Shift = precise")}
            </div>
          </div>
        </div>
      )}
      {cornerHandles.map(({ handle, className, ariaLabel }) => (
        <div
          key={handle}
          className={className}
          onPointerDown={(event) => startResize(event, handle)}
          aria-label={ariaLabel}
          {...interactiveHandleProps}
        />
      ))}
      {edgeHandles.map(({ handle, className, ariaLabel }) => (
        <div
          key={handle}
          className={className}
          onPointerDown={(event) => startResize(event, handle)}
          aria-label={ariaLabel}
          {...interactiveHandleProps}
        />
      ))}
      {spacingHandles.map(({ type, side, className, ariaLabel }) => (
        <div
          key={`${type}-${side}`}
          className={className}
          onPointerDown={(event) => startSpacing(event, type, side)}
          aria-label={ariaLabel}
          {...interactiveHandleProps}
        />
      ))}
    </div>
  );
}
