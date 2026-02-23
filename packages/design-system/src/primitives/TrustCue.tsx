"use client";

import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import { overflowContainmentClass } from "../utils/style";
import { cn } from "../utils/style/cn";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";

export interface TrustCueProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
  /** Semantic surface shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export function TrustCue({
  title,
  description,
  icon,
  className,
  shape,
  radius,
}: TrustCueProps) {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "lg",
  });

  return (
    <div
      role="note"
      aria-label={title}
      className={cn(
        "bg-surface-2 p-3 text-xs text-fg-muted",
        overflowContainmentClass("inlineNoticeSurface"),
        shapeRadiusClass,
        className,
      )}
    >
      <div className="mb-1 flex min-w-0 items-center gap-1.5 font-semibold text-fg">
        <span aria-hidden="true" className="inline-flex">
          {icon ?? <ShieldCheck className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 break-words">{title}</span>
      </div>
      <p className="min-w-0 break-words">{description}</p>
    </div>
  );
}

export default TrustCue;
