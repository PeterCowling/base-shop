"use client";

import * as React from "react";

import { cn } from "../../utils/style";

export type IconButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
export type IconButtonSize = "sm" | "md";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const baseClasses =
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  "inline-flex items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<IconButtonVariant, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  primary: "bg-primary text-primary-fg hover:bg-primary/90", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — utility classes, not user copy
  secondary: "bg-muted text-foreground hover:bg-muted/80", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — utility classes, not user copy
  ghost: "hover:bg-accent hover:text-accent-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — utility classes, not user copy
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — utility classes, not user copy
  quiet: "text-foreground hover:bg-transparent hover:text-accent-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
};

const tokenByVariant: Record<IconButtonVariant, string> = {
  primary: "--color-primary", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS var token names
  secondary: "--color-accent", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS var token names
  ghost: "--color-accent", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS var token names
  danger: "--color-danger", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS var token names
  quiet: "--color-accent", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
};

const sizeClasses: Record<IconButtonSize, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  sm: "h-8 w-8 text-base shrink-0", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — utility classes, not user copy
  md: "h-10 w-10 text-lg shrink-0", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — utility classes, not user copy
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({
    className,
    variant = "ghost",
    size = "sm",
    type = "button",
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    ...props
  }, ref) => {
    const hasTextChild = React.Children.toArray(children).some(
      (child) => typeof child === "string" && child.trim().length > 0,
    );
    const missingAccessibleName = !ariaLabel && !ariaLabelledby && !hasTextChild;

    React.useEffect(() => {
      if (process.env.NODE_ENV !== "production" && missingAccessibleName) {
        console.warn(
          "IconButton: provide aria-label or aria-labelledby for accessible naming.", // i18n-exempt -- UI-2611 developer-facing console hint only
        );
      }
    }, [missingAccessibleName]);

    return (
      <button
        ref={ref}
        type={type}
        data-token={tokenByVariant[variant]}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        data-size={size}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        {...props}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";

export default IconButton;
