"use client";
import type { ReactNode, HTMLAttributes } from "react";

export interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Padding applied to the section */
  padding?: string;
  /** Background color for the section */
  backgroundColor?: string;
  /** Editor-only: per-section grid columns for snapping */
  gridCols?: number;
  /** Editor-only: per-section grid gutter (CSS length) */
  gridGutter?: string;
  /** Editor-only: enable grid snapping inside this section */
  gridSnap?: boolean;
}

export default function Section({
  children,
  padding,
  backgroundColor,
  gridCols,
  gridGutter,
  gridSnap,
  style,
  ...rest
}: SectionProps) {
  return (
    <div
      {...rest}
      style={{ ...style, padding, backgroundColor, ...(gridCols ? { ["--pb-grid-cols" as any]: gridCols } : {}), ...(gridGutter ? { ["--pb-grid-gutter" as any]: gridGutter } : {}), ...(gridSnap !== undefined ? { ["--pb-grid-snap" as any]: gridSnap ? 1 : 0 } : {}) }}
    >
      {children}
    </div>
  );
}
