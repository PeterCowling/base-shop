"use client";
import type { ReactNode } from "react";
import { cn } from "../../../../utils/style";

export interface GridContainerProps {
  children?: ReactNode;
  columns?: number;
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  rows?: number;
  rowsDesktop?: number;
  rowsTablet?: number;
  rowsMobile?: number;
  rowHeights?: string; // e.g. "auto 1fr auto" or "repeat(3, minmax(0, 1fr))"
  /** Template areas in CSS format (e.g. '"hero hero"\n"left right"') */
  areas?: string;
  /** grid-auto-flow */
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
  justifyItems?: "start" | "center" | "end" | "stretch";
  justifyItemsDesktop?: GridContainerProps["justifyItems"];
  justifyItemsTablet?: GridContainerProps["justifyItems"];
  justifyItemsMobile?: GridContainerProps["justifyItems"];
  alignItems?: "start" | "center" | "end" | "stretch";
  alignItemsDesktop?: GridContainerProps["alignItems"];
  alignItemsTablet?: GridContainerProps["alignItems"];
  alignItemsMobile?: GridContainerProps["alignItems"];
  /** Use repeat(auto-fit, minmax(minColWidth, 1fr)) for columns */
  autoFit?: boolean;
  /** Minimum column width when autoFit is enabled (e.g. '240px') */
  minColWidth?: string;
  /** Equalize implicit row heights via grid-auto-rows: 1fr */
  equalizeRows?: boolean;
  className?: string;
  pbViewport?: "desktop" | "tablet" | "mobile";
}

export default function GridContainer({
  children,
  columns,
  columnsDesktop,
  columnsTablet,
  columnsMobile,
  rows,
  rowsDesktop,
  rowsTablet,
  rowsMobile,
  rowHeights,
  areas,
  autoFlow,
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
  autoFit,
  minColWidth,
  equalizeRows,
  className,
  pbViewport,
}: GridContainerProps) {
  const eff = <T,>(base?: T, d?: T, t?: T, m?: T): T | undefined => {
    if (pbViewport === "desktop" && d !== undefined) return d;
    if (pbViewport === "tablet" && t !== undefined) return t;
    if (pbViewport === "mobile" && m !== undefined) return m;
    return base;
  };
  const effCols = eff<number>(columns ?? 2, columnsDesktop, columnsTablet, columnsMobile);
  const effRows = eff<number>(rows, rowsDesktop, rowsTablet, rowsMobile);
  const effGap = eff<string>(gap ?? "1rem", gapDesktop, gapTablet, gapMobile);
  const effJustifyItems = eff<GridContainerProps["justifyItems"]>(justifyItems, justifyItemsDesktop, justifyItemsTablet, justifyItemsMobile);
  const effAlignItems = eff<GridContainerProps["alignItems"]>(alignItems, alignItemsDesktop, alignItemsTablet, alignItemsMobile);

  return (
    <div
      className={cn("grid", className)}
      style={{
        // Explicitly set display to ensure JSDOM exposes it via inline styles in tests
        display: "grid",
        gridTemplateColumns: autoFit
          ? `repeat(auto-fit, minmax(${minColWidth || "240px"}, 1fr))`
          : `repeat(${effCols}, minmax(0, 1fr))`,
        ...(effRows ? { gridTemplateRows: rowHeights ? rowHeights : `repeat(${effRows}, minmax(0, 1fr))` } : {}),
        ...(equalizeRows ? { gridAutoRows: "1fr" } : {}),
        ...(areas ? { gridTemplateAreas: areas } : {}),
        ...(autoFlow ? { gridAutoFlow: autoFlow } : {}),
        gap: effGap,
        ...(effJustifyItems ? { justifyItems: effJustifyItems } : {}),
        ...(effAlignItems ? { alignItems: effAlignItems } : {}),
      }}
    >
      {children}
    </div>
  );
}
