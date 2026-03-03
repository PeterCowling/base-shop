"use client";

import { memo } from "react";

import { cn } from "@acme/design-system/utils/style";

export type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

function SpinnerBase({ size = "sm", className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-border-2 border-t-primary-main/100 motion-reduce:animate-none",
        sizeClasses[size],
        className
      )}
    />
  );
}

export const Spinner = memo(SpinnerBase);
export default Spinner;
