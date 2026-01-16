// File: /src/components/checkins/CustomTooltip.tsx

import React, { memo, useMemo } from "react";

type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right";

interface CustomTooltipProps {
  /** Tooltip content (can be string or JSX). */
  title: React.ReactNode;
  /** Wrapped element that triggers the tooltip on hover. */
  children: React.ReactNode;
  /** Where to position the tooltip relative to the trigger element. */
  placement?: Placement;
  /** Optional style overrides for the tooltip bubble. */
  style?: React.CSSProperties;
}

/**
 * Simple, tailwind-powered tooltip that supports a handful of placements.
 * Intended for lightweight, dependency-free usage without Popper.js.
 */
const CustomTooltip: React.FC<CustomTooltipProps> = ({
  title,
  children,
  placement = "top",
  style,
}) => {
  /** Compute tooltip bubble position classes. */
  const tooltipPosition = useMemo((): string => {
    switch (placement) {
      case "top-start":
        return "bottom-full left-0 translate-x-0 mb-2";
      case "top-end":
        return "bottom-full right-0 translate-x-0 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "bottom-start":
        return "top-full left-0 mt-2";
      case "bottom-end":
        return "top-full right-0 mt-2";
      case "left":
        // use translate-x to avoid relying on the wrapper's width
        return "left-0 -translate-x-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      case "top":
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  }, [placement]);

  /** Compute arrow triangle position & orientation classes. */
  const arrowPosition = useMemo((): string => {
    switch (placement) {
      case "top":
      case "top-start":
      case "top-end":
        return "top-full left-1/2 -translate-x-1/2 border-t-black";
      case "bottom":
      case "bottom-start":
      case "bottom-end":
        return "bottom-full left-1/2 -translate-x-1/2 rotate-180 border-t-black";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 -rotate-90 border-t-black";
      case "right":
        return "right-full top-1/2 -translate-y-1/2 rotate-90 border-t-black";
      default:
        return "top-full left-1/2 -translate-x-1/2 border-t-black";
    }
  }, [placement]);

  return (
    <div className="relative inline-block group">
      {children}

      {/* Tooltip bubble */}
      <span
        className={[
          "absolute",
          tooltipPosition,
          "w-max max-w-xs px-3 py-2 rounded bg-black bg-opacity-75 text-white text-sm",
          "opacity-0 invisible group-hover:visible group-hover:opacity-100",
          "transition-opacity z-10",
        ].join(" ")}
        style={style}
      >
        {title}

        {/* Arrow */}
        <span
          className={[
            "absolute border-[5px] border-transparent",
            arrowPosition,
          ].join(" ")}
        />
      </span>
    </div>
  );
};

export default memo(CustomTooltip);
