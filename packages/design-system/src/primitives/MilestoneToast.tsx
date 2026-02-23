"use client";

import { CheckCircle2 } from "lucide-react";

import useReducedMotion from "../hooks/useReducedMotion";
import { overflowContainmentClass } from "../utils/style";
import { cn } from "../utils/style/cn";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";

export interface MilestoneToastProps {
  message: string | null;
  className?: string;
  /** Semantic surface shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export function MilestoneToast({
  message,
  className,
  shape,
  radius,
}: MilestoneToastProps) {
  const prefersReducedMotion = useReducedMotion();
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "lg",
  });

  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 bg-success-soft px-3 py-2 text-sm font-medium text-success-fg",
        overflowContainmentClass("inlineNoticeSurface"),
        shapeRadiusClass,
        prefersReducedMotion ? "" : "animate-pulse",
        className,
      )}
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
}

export default MilestoneToast;
