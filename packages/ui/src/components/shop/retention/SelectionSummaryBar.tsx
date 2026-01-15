"use client";

/* eslint-disable ds/container-widths-only-at, ds/no-hardcoded-copy -- UI-9999 [ttl=2026-12-31] retention UI awaiting design/i18n pass */

import * as React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { cn } from "../../../utils/style";
import { Button } from "../../atoms";
import useReducedMotion from "../../../hooks/useReducedMotion";

export interface SelectionSummaryBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  summary?: React.ReactNode;
  price?: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
  actionBusy?: boolean;
  defaultCollapsed?: boolean;
  collapseOnScroll?: boolean;
  expandLabel: string;
  collapseLabel: string;
}

export function SelectionSummaryBar({
  summary,
  price,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionBusy = false,
  defaultCollapsed = false,
  collapseOnScroll = true,
  expandLabel,
  collapseLabel,
  className,
  ...props
}: SelectionSummaryBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  React.useEffect(() => {
    if (!collapseOnScroll) return;
    if (typeof window === "undefined") return;

    let prevY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const nextY = window.scrollY;
        const delta = nextY - prevY;
        prevY = nextY;
        ticking = false;

        if (Math.abs(delta) < 10) return;
        if (delta > 0) setCollapsed(true);
        if (delta < 0) setCollapsed(false);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [collapseOnScroll]);

  const toggle = React.useCallback(() => {
    setCollapsed((v) => !v);
  }, []);

  const ToggleIcon = collapsed ? ChevronUpIcon : ChevronDownIcon;
  const toggleLabel = collapsed ? expandLabel : collapseLabel;

  return (
    <div
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        "fixed inset-x-0 bottom-0 z-30 border-t border-border-1 bg-surface-1/95 backdrop-blur",
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        "pb-[calc(var(--safe-bottom)+1rem)] pt-3",
        className,
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-md px-4">
        <div
          className={cn(
            "overflow-hidden transition-[max-height,opacity] duration-200", // i18n-exempt
            prefersReducedMotion && "transition-none", // i18n-exempt
            collapsed ? "max-h-0 opacity-0" : "max-h-32 opacity-100",
          )}
          aria-hidden={collapsed}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="text-sm text-muted-foreground">{summary}</div>
            {price ? (
              <div className="text-base font-semibold text-foreground">
                {price}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              "min-h-11 min-w-11 rounded-full border border-border-1 bg-surface-2 px-3 text-foreground",
              "focus-visible:focus-ring",
            )}
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={toggleLabel}
          >
            <ToggleIcon aria-hidden className="mx-auto h-4 w-4" />
          </button>

          <Button
            type="button"
            color="accent"
            tone="solid"
            className="min-h-11 flex-1 rounded-full px-5"
            onClick={onAction}
            disabled={actionDisabled}
            aria-busy={actionBusy}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
