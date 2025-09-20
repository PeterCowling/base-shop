"use client";
import type { ReactNode } from "react";
import { cn } from "../../../../utils/style";

export interface MultiColumnProps {
  children?: ReactNode;
  /** Number of columns in the grid */
  columns?: number;
  /** Responsive columns */
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  /** Gap between columns/rows (any CSS length) */
  gap?: string;
  /** Responsive gaps */
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
  /** Default grid item alignment on inline axis */
  justifyItems?: "start" | "center" | "end" | "stretch";
  justifyItemsDesktop?: "start" | "center" | "end" | "stretch";
  justifyItemsTablet?: "start" | "center" | "end" | "stretch";
  justifyItemsMobile?: "start" | "center" | "end" | "stretch";
  /** Default grid item alignment on block axis */
  alignItems?: "start" | "center" | "end" | "stretch";
  alignItemsDesktop?: "start" | "center" | "end" | "stretch";
  alignItemsTablet?: "start" | "center" | "end" | "stretch";
  alignItemsMobile?: "start" | "center" | "end" | "stretch";
  className?: string;
  /** Builder-only: active viewport to resolve responsive props */
  pbViewport?: "desktop" | "tablet" | "mobile";
}

export default function MultiColumn({
  children,
  columns,
  columnsDesktop,
  columnsTablet,
  columnsMobile,
  gap,
  gapDesktop,
  gapTablet,
  gapMobile,
  justifyItems,
  justifyItemsDesktop,
  justifyItemsTablet,
  justifyItemsMobile,
  alignItems,
  alignItemsDesktop,
  alignItemsTablet,
  alignItemsMobile,
  className,
  pbViewport,
}: MultiColumnProps) {
  const effColumns = (() => {
    if (pbViewport === "desktop" && typeof columnsDesktop === "number") return columnsDesktop;
    if (pbViewport === "tablet" && typeof columnsTablet === "number") return columnsTablet;
    if (pbViewport === "mobile" && typeof columnsMobile === "number") return columnsMobile;
    return typeof columns === "number" ? columns : 2;
  })();
  const effGap = (() => {
    if (pbViewport === "desktop" && gapDesktop) return gapDesktop;
    if (pbViewport === "tablet" && gapTablet) return gapTablet;
    if (pbViewport === "mobile" && gapMobile) return gapMobile;
    return gap ?? "1rem";
  })();
  const effJustifyItems = (() => {
    if (pbViewport === "desktop" && justifyItemsDesktop) return justifyItemsDesktop;
    if (pbViewport === "tablet" && justifyItemsTablet) return justifyItemsTablet;
    if (pbViewport === "mobile" && justifyItemsMobile) return justifyItemsMobile;
    return justifyItems;
  })();
  const effAlignItems = (() => {
    if (pbViewport === "desktop" && alignItemsDesktop) return alignItemsDesktop;
    if (pbViewport === "tablet" && alignItemsTablet) return alignItemsTablet;
    if (pbViewport === "mobile" && alignItemsMobile) return alignItemsMobile;
    return alignItems;
  })();
  return (
    <div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(${effColumns}, minmax(0, 1fr))`,
        gap: effGap,
        ...(effJustifyItems ? { justifyItems: effJustifyItems } : {}),
        ...(effAlignItems ? { alignItems: effAlignItems } : {}),
      }}
    >
      {children}
    </div>
  );
}
