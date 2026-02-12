"use client";

import { CheckCircle2 } from "lucide-react";

import useReducedMotion from "../hooks/useReducedMotion";
import { cn } from "../utils/style/cn";

export interface MilestoneToastProps {
  message: string | null;
  className?: string;
}

export function MilestoneToast({ message, className }: MilestoneToastProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success-fg",
        prefersReducedMotion ? "" : "animate-pulse",
        className,
      )}
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default MilestoneToast;
