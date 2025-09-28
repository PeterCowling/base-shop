"use client";
import type { ReactNode } from "react";
import { cn } from "../../../../utils/style";

export interface StackFlexProps {
  children?: ReactNode;
  direction?: "row" | "column";
  directionDesktop?: "row" | "column";
  directionTablet?: "row" | "column";
  directionMobile?: "row" | "column";
  wrap?: boolean;
  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  justifyDesktop?: StackFlexProps["justify"];
  justifyTablet?: StackFlexProps["justify"];
  justifyMobile?: StackFlexProps["justify"];
  align?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  alignDesktop?: StackFlexProps["align"];
  alignTablet?: StackFlexProps["align"];
  alignMobile?: StackFlexProps["align"];
  className?: string;
  pbViewport?: "desktop" | "tablet" | "mobile";
}

export default function StackFlex({
  children,
  direction,
  directionDesktop,
  directionTablet,
  directionMobile,
  wrap,
  gap,
  gapDesktop,
  gapTablet,
  gapMobile,
  justify,
  justifyDesktop,
  justifyTablet,
  justifyMobile,
  align,
  alignDesktop,
  alignTablet,
  alignMobile,
  className,
  pbViewport,
}: StackFlexProps) {
  const eff = <T,>(base?: T, d?: T, t?: T, m?: T): T | undefined => {
    if (pbViewport === "desktop" && d !== undefined) return d;
    if (pbViewport === "tablet" && t !== undefined) return t;
    if (pbViewport === "mobile" && m !== undefined) return m;
    return base;
  };

  const effDirection = eff<NonNullable<StackFlexProps["direction"]>>(direction ?? "column", directionDesktop, directionTablet, directionMobile);
  const effGap = eff<string>(gap ?? "1rem", gapDesktop, gapTablet, gapMobile) ?? "1rem";
  const effJustify = eff<StackFlexProps["justify"]>(justify, justifyDesktop, justifyTablet, justifyMobile);
  const effAlign = eff<StackFlexProps["align"]>(align, alignDesktop, alignTablet, alignMobile);

  return (
    <div
      className={cn("flex", className)}
      /* eslint-disable-next-line react/forbid-dom-props -- UI-2610: Dynamic flexbox properties computed at runtime */
      style={{
        flexDirection: effDirection,
        flexWrap: wrap ? "wrap" : "nowrap",
        gap: effGap,
        ...(effJustify ? { justifyContent: effJustify } : {}),
        ...(effAlign ? { alignItems: effAlign } : {}),
      }}
    >
      {children}
    </div>
  );
}
