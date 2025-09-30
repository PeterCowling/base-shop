"use client";

import * as React from "react";
import { cn } from "../../utils/style";
import { Slot } from "@radix-ui/react-slot";

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
}

export const LinkText = React.forwardRef<HTMLAnchorElement, LinkTextProps>(
  ({ className, color = "primary", tone = "default", asChild = false, children, ...props }, ref) => {
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
    const Comp: React.ElementType = asChild ? Slot : "a";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — class names
          textByColor[color],
          tone === "soft" ? cn("rounded px-0.5", softHoverByColor[color]) : "hover:underline", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — class names
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
LinkText.displayName = "LinkText"; // i18n-exempt -- DS-1234 [ttl=2025-11-30] — component displayName
