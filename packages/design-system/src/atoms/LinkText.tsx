"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export type LinkColor =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "danger";

export type LinkTone = "default" | "soft";

export interface LinkTextProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: LinkColor;
  tone?: LinkTone;
  asChild?: boolean;
  /** Semantic soft-tone surface shape. Ignored when `softRadius` is provided. */
  softShape?: PrimitiveShape;
  /** Explicit soft-tone surface radius token override. */
  softRadius?: PrimitiveRadius;
}

export const LinkText = (
  {
    ref,
    className,
    color = "primary",
    tone = "default",
    asChild = false,
    softShape,
    softRadius,
    children,
    ...props
  }: LinkTextProps & {
    ref?: React.Ref<HTMLAnchorElement>;
  }
) => {
  const textByColor: Record<LinkColor, string> = {
    default: "text-link",
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success-fg",
    info: "text-info-fg",
    warning: "text-warning-fg",
    danger: "text-danger-fg",
  };
  const softHoverByColor: Record<LinkColor, string> = {
    default: "hover:bg-surface-3",
    primary: "hover:bg-primary-soft",
    accent: "hover:bg-accent-soft",
    success: "hover:bg-success-soft",
    info: "hover:bg-info-soft",
    warning: "hover:bg-warning-soft",
    danger: "hover:bg-danger-soft",
  };
  const softShapeRadiusClass = resolveShapeRadiusClass({
    shape: softShape,
    radius: softRadius,
    defaultRadius: "sm",
  });
  const Comp: React.ElementType = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      className={cn(
        "inline-flex items-center", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — class names
        textByColor[color],
        tone === "soft"
          ? cn("px-0.5", softShapeRadiusClass, softHoverByColor[color])
          : "hover:underline", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — class names
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
};
