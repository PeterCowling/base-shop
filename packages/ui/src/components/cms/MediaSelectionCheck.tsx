// packages/ui/src/components/cms/MediaSelectionCheck.tsx
"use client";

import { CheckIcon } from "@radix-ui/react-icons";
import type { ReactElement } from "react";
import { cn } from "../../utils/style";

export interface MediaSelectionCheckProps {
  /** Whether the media item is currently selected. */
  selected: boolean;
  /** Optional additional class names. */
  className?: string;
}

/**
 * Displays a checkmark overlay used to indicate selected media items
 * in the media library.
 */
export default function MediaSelectionCheck({
  selected,
  className,
}: MediaSelectionCheckProps): ReactElement {
  return (
    <span
      data-testid="media-selection-check" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      className={cn(
        "pointer-events-none absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border border-bg bg-primary text-primary-fg transition-opacity" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */,
        selected ? "opacity-100" : "opacity-0" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */,
        className,
      )}
    >
      <CheckIcon aria-hidden className="h-4 w-4" /> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
    </span>
  );
}
