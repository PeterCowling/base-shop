"use client";
/**
 * @deprecated Import IconButton from "@acme/design-system/atoms" instead.
 * This shim exists for backward compatibility and will be removed in a future release.
 */

import type { ButtonHTMLAttributes } from "react";
import React from "react";

import { IconButton as DesignSystemIconButton } from "@acme/design-system/atoms";

// Warn once per session to avoid log spam
const WARN_KEY = "__acme_ui_iconbutton_deprecation_warned__";

function warnDeprecation(): void {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return;

  try {
    if (!sessionStorage.getItem(WARN_KEY)) {
      console.warn(
        "[@acme/ui] IconButton is deprecated. Import from @acme/design-system/atoms instead. " +
          "See docs/plans/ui-architecture-consolidation-plan.md for migration guidance."
      );
      sessionStorage.setItem(WARN_KEY, "1");
    }
  } catch {
    // Storage disabled or quota exceeded — ignore
  }
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  /** Optional variant (ghost is default for backwards compat) */
  variant?: "primary" | "secondary" | "ghost" | "danger" | "quiet";
  /** Optional size (sm is default) */
  size?: "sm" | "md";
}

/**
 * IconButton — focuses on hit target and accessibility.
 * @deprecated Use @acme/design-system/atoms IconButton instead.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  children,
  "aria-label": ariaLabel,
  variant = "ghost",
  size = "sm",
  ...rest
}) => {
  warnDeprecation();

  return (
    <DesignSystemIconButton aria-label={ariaLabel} variant={variant} size={size} {...rest}>
      {children}
    </DesignSystemIconButton>
  );
};

export default IconButton;
