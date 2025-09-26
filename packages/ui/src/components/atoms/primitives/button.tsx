// packages/ui/components/atoms/primitives/button.tsx
"use client";
import * as React from "react";
import { cn } from "../../../utils/style";
import { Slot } from "./slot";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
type LegacyVariant = "default" | "outline" | "ghost" | "destructive";
type ButtonTone = "solid" | "soft" | "outline" | "ghost";
type ButtonColor = "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Legacy variant prop maintained for back-compat (default/outline/ghost/destructive).
   * Prefer using `color` + `tone` for new code.
   */
  variant?: LegacyVariant;
  /** Semantic color intent (default maps to neutral/muted). */
  color?: ButtonColor;
  /** Visual tone for the button. */
  tone?: ButtonTone;
  /** Optional leading icon node */
  leadingIcon?: React.ReactNode;
  /** Optional trailing icon node */
  trailingIcon?: React.ReactNode;
  /** Icon size utility: sm=14px, md=16px, lg=20px (default: md) */
  iconSize?: "sm" | "md" | "lg";
  /** Render as square icon-only button (provide aria-label). */
  iconOnly?: boolean;
  asChild?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      color,
      tone,
      children,
      leadingIcon,
      trailingIcon,
      iconSize = "md",
      iconOnly = false,
      disabled,
      "aria-busy": ariaBusy,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const base =
      "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

    // Back-compat: map legacy `variant` into color/tone
    const legacyMap: Record<LegacyVariant, { color: ButtonColor; tone: ButtonTone }> = {
      default: { color: "primary", tone: "solid" },
      outline: { color: "accent", tone: "outline" },
      ghost: { color: "accent", tone: "ghost" },
      destructive: { color: "danger", tone: "solid" },
    };

    const effColor: ButtonColor = color ?? legacyMap[variant].color;
    const effTone: ButtonTone = tone ?? legacyMap[variant].tone;

    const solidBg: Record<ButtonColor, string> = {
      default: "bg-muted text-fg hover:bg-muted/80",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90",
      success: "bg-success text-success-foreground hover:bg-success/90",
      info: "bg-info text-info-foreground hover:bg-info/90",
      warning: "bg-warning text-warning-foreground hover:bg-warning/90",
      danger: "bg-danger text-danger-foreground hover:bg-danger/90",
    };

    const softBg: Record<ButtonColor, string> = {
      default: "bg-muted text-fg hover:bg-muted/70",
      primary: "bg-primary-soft text-fg hover:bg-primary/20",
      accent: "bg-accent-soft text-fg hover:bg-accent/20",
      success: "bg-success-soft text-fg hover:bg-success/20",
      info: "bg-info-soft text-fg hover:bg-info/20",
      warning: "bg-warning-soft text-fg hover:bg-warning/20",
      danger: "bg-danger-soft text-fg hover:bg-danger/20",
    };

    const outlineBg: Record<ButtonColor, string> = {
      default: "border border-border-2 text-fg hover:bg-surface-2",
      primary: "border border-border-2 text-fg hover:bg-primary-soft",
      accent: "border border-border-2 text-fg hover:bg-accent-soft",
      success: "border border-border-2 text-fg hover:bg-success-soft",
      info: "border border-border-2 text-fg hover:bg-info-soft",
      warning: "border border-border-2 text-fg hover:bg-warning-soft",
      danger: "border border-border-2 text-fg hover:bg-danger-soft",
    };

    const ghostBg: Record<ButtonColor, string> = {
      default: "text-fg hover:bg-surface-2",
      primary: "text-fg hover:bg-primary-soft",
      accent: "text-fg hover:bg-accent-soft",
      success: "text-fg hover:bg-success-soft",
      info: "text-fg hover:bg-info-soft",
      warning: "text-fg hover:bg-warning-soft",
      danger: "text-fg hover:bg-danger-soft",
    };

    const classesByTone: Record<ButtonTone, Record<ButtonColor, string>> = {
      solid: solidBg,
      soft: softBg,
      outline: outlineBg,
      ghost: ghostBg,
    };

    const Comp = asChild ? Slot : "button";

    const dataTokenByColor: Record<ButtonColor, string> = {
      default: "--color-muted",
      primary: "--color-primary",
      accent: "--color-accent",
      success: "--color-success",
      info: "--color-info",
      warning: "--color-warning",
      danger: "--color-danger",
    };

    const isLoading = ariaBusy === true || (typeof ariaBusy === "string" && ariaBusy !== "false");
    const isDisabled = Boolean(disabled) || isLoading;
    const computedClasses = cn(
      base,
      classesByTone[effTone][effColor],
      // Ensure legacy expectations for specific variants
      variant === "outline" && "border-input",
      variant === "ghost" && effColor === "accent" && "hover:bg-accent",
      variant === "destructive" && "bg-destructive",
      iconOnly && "h-10 w-10 p-0 justify-center",
      isLoading && "cursor-progress opacity-70",
      className,
    );

    // When using asChild, Slot must receive exactly one valid element child.
    if (asChild) {
      return (
        <Comp
          ref={ref as unknown as React.Ref<HTMLElement>}
          data-token={dataTokenByColor[effColor]}
          className={computedClasses}
          aria-busy={isLoading || undefined}
          // Do not forward `disabled` to non-button elements
          {...props}
        >
          {children as React.ReactElement}
        </Comp>
      );
    }

    // Default: render a real button with internal layout helpers
    return (
      <Comp
        ref={ref}
        data-token={dataTokenByColor[effColor]}
        className={computedClasses}
        aria-busy={isLoading || undefined}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <span
            className={cn(
              "mr-2 inline-flex animate-spin rounded-full border-2 border-current border-t-transparent",
              iconSize === "sm" ? "h-3.5 w-3.5" : iconSize === "lg" ? "h-5 w-5" : "h-4 w-4",
            )}
            aria-hidden="true"
          />
        )}
        {!isLoading && leadingIcon ? (
          <span
            className={cn(
              "mr-2 inline-flex items-center justify-center",
              iconSize === "sm" ? "h-3.5 w-3.5" : iconSize === "lg" ? "h-5 w-5" : "h-4 w-4",
            )}
            aria-hidden
          >
            {leadingIcon}
          </span>
        ) : null}
        {iconOnly ? (
          <span className="sr-only">{children}</span>
        ) : (
          // Render text directly so tests targeting getByText() receive the button element
          <>{children}</>
        )}
        {!isLoading && trailingIcon ? (
          <span
            className={cn(
              "ml-2 inline-flex items-center justify-center",
              iconSize === "sm" ? "h-3.5 w-3.5" : iconSize === "lg" ? "h-5 w-5" : "h-4 w-4",
            )}
            aria-hidden
          >
            {trailingIcon}
          </span>
        ) : null}
      </Comp>
    );
  },
);
Button.displayName = "Button";
