"use client";
/**
 * @deprecated Import Button from "@acme/design-system/primitives" instead.
 * This shim exists for backward compatibility and will be removed in a future release.
 */

import * as React from "react";

import { Button as DesignSystemButton } from "@acme/design-system/primitives";

import type { ButtonSize, ButtonVariant } from "../types/button";

// Combined props: legacy API + design-system API for smooth migration
type ButtonTone = "solid" | "soft" | "outline" | "ghost" | "quiet";
type ButtonColor = "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** Legacy variant prop (default/outline/ghost/secondary/destructive) */
  variant?: ButtonVariant;
  /** Legacy size prop (default/sm/lg/icon) */
  size?: ButtonSize;
  /** Design-system color prop */
  color?: ButtonColor;
  /** Design-system tone prop */
  tone?: ButtonTone;
  /** Legacy ariaLabel prop - use aria-label instead */
  ariaLabel?: string;
  /** Render as child element */
  asChild?: boolean;
  /** Leading icon node */
  leadingIcon?: React.ReactNode;
  /** Trailing icon node */
  trailingIcon?: React.ReactNode;
  /** Icon size */
  iconSize?: "sm" | "md" | "lg";
  /** Render as icon-only button */
  iconOnly?: boolean;
}

// Warn once per session to avoid log spam
const WARN_KEY = "__acme_ui_button_deprecation_warned__";

function warnDeprecation(): void {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return;

  try {
    if (!sessionStorage.getItem(WARN_KEY)) {
      console.warn(
        "[@acme/ui] Button is deprecated. Import from @acme/design-system/primitives instead. " +
          "See docs/plans/ui-architecture-consolidation-plan.md for migration guidance."
      );
      sessionStorage.setItem(WARN_KEY, "1");
    }
  } catch {
    // Storage disabled or quota exceeded — ignore
  }
}

// Map legacy variant to design-system variant
const variantMap: Record<ButtonVariant, "default" | "outline" | "ghost" | "destructive"> = {
  default: "default",
  outline: "outline",
  ghost: "ghost",
  secondary: "default", // secondary maps to default with soft tone
  destructive: "destructive",
};

// Map legacy size to design-system size
function mapSize(size: ButtonSize): { size?: "sm" | "md" | "lg"; iconOnly?: boolean } {
  switch (size) {
    case "default":
      return { size: "md" };
    case "sm":
      return { size: "sm" };
    case "lg":
      return { size: "lg" };
    case "icon":
      return { size: "md", iconOnly: true };
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "default",
      size = "default",
      color,
      tone,
      ariaLabel,
      asChild,
      className,
      children,
      leadingIcon,
      trailingIcon,
      iconSize,
      iconOnly: iconOnlyProp,
      ...rest
    },
    ref
  ) {
    warnDeprecation();

    const mappedVariant = variantMap[variant];
    const { size: mappedSize, iconOnly: iconOnlyFromSize } = mapSize(size);

    // Determine tone: explicit tone > secondary variant mapping > undefined
    const effectiveTone = tone ?? (variant === "secondary" ? "soft" : undefined);

    // Determine iconOnly: explicit prop > size="icon" mapping
    const effectiveIconOnly = iconOnlyProp ?? iconOnlyFromSize;

    return (
      <DesignSystemButton
        ref={ref}
        variant={mappedVariant}
        color={color}
        tone={effectiveTone}
        size={mappedSize}
        iconOnly={effectiveIconOnly}
        asChild={asChild}
        className={className}
        aria-label={ariaLabel}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        iconSize={iconSize}
        {...rest}
      >
        {children}
      </DesignSystemButton>
    );
  }
);

Button.displayName = "Button";

export default Button;

// Re-export types for backwards compatibility
export type { ButtonSize, ButtonVariant } from "../types/button";
