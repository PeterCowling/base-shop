"use client";

import * as React from "react";

import { cn } from "../utils/style";

export interface TooltipProps {
  text: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const mergeHandlers = <E extends React.SyntheticEvent<HTMLElement>>(
  theirs: ((event: E) => void) | undefined,
  ours: () => void,
) => {
  if (!theirs) return (event: E) => { if (!event.defaultPrevented) ours(); };
  return (event: E) => {
    theirs(event);
    if (!event.defaultPrevented) {
      ours();
    }
  };
};

export const Tooltip = ({ text, children, className }: TooltipProps) => {
  const [open, setOpen] = React.useState(false);
  const tooltipId = React.useId();
  const show = React.useCallback(() => setOpen(true), []);
  const hide = React.useCallback(() => setOpen(false), []);

  let trigger: React.ReactNode = children;
  if (React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)) {
    const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    const describedBy = child.props["aria-describedby"];

    const mergedProps: React.HTMLAttributes<HTMLElement> = {
      onFocus: mergeHandlers(child.props.onFocus, show),
      onBlur: mergeHandlers(child.props.onBlur, hide),
      onMouseEnter: mergeHandlers(child.props.onMouseEnter, show),
      onMouseLeave: mergeHandlers(child.props.onMouseLeave, hide),
      className: cn(child.props.className, "focus-visible:focus-ring"),
      "aria-describedby": open
        ? [describedBy, tooltipId].filter(Boolean).join(" ")
        : describedBy,
    };

    trigger = React.cloneElement(child, mergedProps);
  } else {
    trigger = (
      <span
        onFocus={show}
        onBlur={hide}
        onMouseEnter={show}
        onMouseLeave={hide}
        role="button"
        aria-describedby={open ? tooltipId : undefined}
        tabIndex={0}
        className="focus-visible:focus-ring"
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        "relative inline-flex max-w-full",
        className,
      )}
    >
      {trigger}
      <span
        id={tooltipId}
        role="tooltip"
        aria-hidden={!open}
        data-state={open ? "open" : "closed"}
        className={cn(
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          "bg-fg text-bg pointer-events-none absolute top-full z-tooltip mt-2 whitespace-nowrap rounded px-2 py-1 text-xs shadow-md transition-opacity motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        {text}
      </span>
    </span>
  );
};
