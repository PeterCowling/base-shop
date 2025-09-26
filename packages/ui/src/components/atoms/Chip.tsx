"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { Tag, TagProps } from "./Tag";

export interface ChipProps extends TagProps {
  onRemove?: () => void;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ onRemove, children, className, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ms-1 font-bold focus:outline-none inline-flex items-center justify-center min-h-10 min-w-10"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </Tag>
  )
);
Chip.displayName = "Chip";
