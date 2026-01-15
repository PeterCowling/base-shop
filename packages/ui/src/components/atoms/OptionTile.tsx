"use client";

import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "../../utils/style";

export interface OptionTileProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  selectedLabel?: React.ReactNode;
  /** Extra cue for selection, independent of color. */
  showCheck?: boolean;
}

export const OptionTile = React.forwardRef<HTMLButtonElement, OptionTileProps>(
  (
    {
      selected = false,
      selectedLabel,
      showCheck = true,
      className,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — utility class names only
          "group relative rounded-2xl border bg-surface-2 p-2 text-start transition",
          // i18n-exempt -- DS-1234 [ttl=2025-11-30]
          "focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60",
          selected
            ? // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              "border-border-3 ring-1 ring-border-3"
            : // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              "border-border-1 hover:border-primary/60",
          className,
        )}
        aria-pressed={selected}
        {...props}
      >
        {showCheck ? (
          <span
            aria-hidden
            className={cn(
              // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              "pointer-events-none absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-surface-1 shadow-elevation-1 transition",
              selected
                ? // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                  "border-border-3 opacity-100"
                : // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                  "border-border-1 opacity-0 group-hover:opacity-60",
            )}
          >
            <CheckIcon className="h-4 w-4 text-foreground" />
          </span>
        ) : null}

        {children}

        {selected && selectedLabel ? (
          <span
            className={cn(
              // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              "inline-flex items-center rounded-full border border-border-2 bg-surface-1 px-2 py-0.5 text-xs font-semibold text-foreground",
            )}
          >
            {selectedLabel}
          </span>
        ) : null}
      </button>
    );
  },
);

OptionTile.displayName = "OptionTile"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
