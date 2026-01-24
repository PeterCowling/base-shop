// packages/ui/components/atoms/primitives/button.tsx
 
"use client";
import * as React from "react";

import { cn } from "../utils/style";

import { Slot } from "./slot";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
type LegacyVariant = "default" | "outline" | "ghost" | "destructive";
type ButtonTone = "solid" | "soft" | "outline" | "ghost" | "quiet";
type ButtonColor = "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger";
type ButtonSize = "sm" | "md" | "lg";

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
  /** Size scale for padding/height/typography. */
  size?: ButtonSize;
}

/* -------------------------------------------------------------------------- */
/*  Styling                                                                    */
/* -------------------------------------------------------------------------- */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const LEGACY_VARIANT_MAP: Record<LegacyVariant, { color: ButtonColor; tone: ButtonTone }> = {
  default: { color: "primary", tone: "solid" },
  outline: { color: "accent", tone: "outline" },
  ghost: { color: "accent", tone: "ghost" },
  destructive: { color: "danger", tone: "solid" },
};

const SOLID_CLASSES: Record<ButtonColor, string> = {
  default: "bg-muted text-fg hover:bg-muted/80",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
  info: "bg-info text-info-foreground hover:bg-info/90",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90",
};

const SOFT_CLASSES: Record<ButtonColor, string> = {
  default: "bg-muted text-fg hover:bg-muted/70",
  primary: "bg-primary-soft text-fg hover:bg-primary/20",
  accent: "bg-accent-soft text-fg hover:bg-accent/20",
  success: "bg-success-soft text-fg hover:bg-success/20",
  info: "bg-info-soft text-fg hover:bg-info/20",
  warning: "bg-warning-soft text-fg hover:bg-warning/20",
  danger: "bg-danger-soft text-fg hover:bg-danger/20",
};

const OUTLINE_CLASSES: Record<ButtonColor, string> = {
  default: "border border-border-2 text-fg hover:bg-surface-2",
  primary: "border border-border-2 text-fg hover:bg-primary-soft",
  accent: "border border-border-2 text-fg hover:bg-accent-soft",
  success: "border border-border-2 text-fg hover:bg-success-soft",
  info: "border border-border-2 text-fg hover:bg-info-soft",
  warning: "border border-border-2 text-fg hover:bg-warning-soft",
  danger: "border border-border-2 text-fg hover:bg-danger-soft",
};

const GHOST_CLASSES: Record<ButtonColor, string> = {
  default: "text-fg hover:bg-surface-2",
  primary: "text-fg hover:bg-primary-soft",
  accent: "text-fg hover:bg-accent-soft",
  success: "text-fg hover:bg-success-soft",
  info: "text-fg hover:bg-info-soft",
  warning: "text-fg hover:bg-warning-soft",
  danger: "text-fg hover:bg-danger-soft",
};

const QUIET_CLASSES: Record<ButtonColor, string> = {
  default: "text-fg hover:bg-transparent",
  primary: "text-primary hover:bg-primary-soft/50",
  accent: "text-accent hover:bg-accent-soft/50",
  success: "text-success hover:bg-success-soft/50",
  info: "text-info hover:bg-info-soft/50",
  warning: "text-warning hover:bg-warning-soft/50",
  danger: "text-danger hover:bg-danger-soft/50",
};

const CLASSES_BY_TONE: Record<ButtonTone, Record<ButtonColor, string>> = {
  solid: SOLID_CLASSES,
  soft: SOFT_CLASSES,
  outline: OUTLINE_CLASSES,
  ghost: GHOST_CLASSES,
  quiet: QUIET_CLASSES,
};

const DATA_TOKEN_BY_COLOR: Record<ButtonColor, string> = {
  default: "--color-muted",
  primary: "--color-primary",
  accent: "--color-accent",
  success: "--color-success",
  info: "--color-info",
  warning: "--color-warning",
  danger: "--color-danger",
};

const ICON_ONLY_CLASSES_BY_SIZE: Record<ButtonSize, string> = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

function resolveEffectiveColorTone({
  variant,
  color,
  tone,
}: Pick<ButtonProps, "variant" | "color" | "tone">): { color: ButtonColor; tone: ButtonTone } {
  const fallback = LEGACY_VARIANT_MAP[variant ?? "default"];
  return {
    color: color ?? fallback.color,
    tone: tone ?? fallback.tone,
  };
}

function coerceAriaBusy(ariaBusy: ButtonProps["aria-busy"]): boolean {
  if (ariaBusy === true) return true;
  if (typeof ariaBusy === "string") return ariaBusy !== "false";
  return false;
}

function iconDimensionClass(iconSize: NonNullable<ButtonProps["iconSize"]>): string {
  if (iconSize === "sm") return "h-3.5 w-3.5";
  if (iconSize === "lg") return "h-5 w-5";
  return "h-4 w-4";
}

function renderIcon({
  icon,
  className,
  iconSize,
}: {
  icon: React.ReactNode;
  className: string;
  iconSize: NonNullable<ButtonProps["iconSize"]>;
}): React.ReactNode {
  if (!icon) return null;
  return (
    <span
      className={cn("inline-flex items-center justify-center", className, iconDimensionClass(iconSize))}
      aria-hidden
    >
      {icon}
    </span>
  );
}

function computeIsDisabled(disabled: ButtonProps["disabled"], isLoading: boolean): boolean {
  return Boolean(disabled) || isLoading;
}

function legacyVariantClassName(variant: LegacyVariant, effColor: ButtonColor): string {
  if (variant === "outline") return "border-input";
  if (variant === "destructive") return "bg-destructive";
  if (variant === "ghost" && effColor === "accent") return "hover:bg-accent hover:text-accent-foreground";
  return "";
}

function buildButtonClassName({
  size,
  tone,
  color,
  variant,
  iconOnly,
  isLoading,
  className,
}: {
  size: ButtonSize;
  tone: ButtonTone;
  color: ButtonColor;
  variant: LegacyVariant;
  iconOnly: boolean;
  isLoading: boolean;
  className?: string;
}): string {
  return cn(
    BASE_CLASSES,
    SIZE_CLASSES[size],
    CLASSES_BY_TONE[tone][color],
    legacyVariantClassName(variant, color),
    iconOnly ? `${ICON_ONLY_CLASSES_BY_SIZE[size]} p-0 justify-center` : "",
    isLoading ? "cursor-progress opacity-70" : "",
    className,
  );
}

function renderSpinner({
  isLoading,
  iconSize,
}: {
  isLoading: boolean;
  iconSize: NonNullable<ButtonProps["iconSize"]>;
}): React.ReactNode {
  if (!isLoading) return null;
  return (
    <span
      className={cn(
        "me-2 inline-flex animate-spin motion-reduce:animate-none rounded-full border-2 border-current border-t-transparent",
        iconDimensionClass(iconSize),
      )}
      aria-hidden="true"
    />
  );
}

function renderContent({
  iconOnly,
  children,
}: {
  iconOnly: boolean;
  children: React.ReactNode;
}): React.ReactNode {
  if (!iconOnly) return children;
  return <span className="sr-only">{children}</span>;
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
      size = "md",
      disabled,
      "aria-busy": ariaBusy,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    // Render polymorphically: either a real button or our Slot wrapper
    const Comp: React.ElementType = asChild ? Slot : "button";

    const { color: effColor, tone: effTone } = resolveEffectiveColorTone({
      variant,
      color,
      tone,
    });

    const isLoading = coerceAriaBusy(ariaBusy);
    const isDisabled = computeIsDisabled(disabled, isLoading);
    const computedClasses = buildButtonClassName({
      size,
      tone: effTone,
      color: effColor,
      variant,
      iconOnly,
      isLoading,
      className,
    });

    // When using asChild, Slot must receive exactly one valid element child.
    if (asChild) {
      return (
        <Comp
          ref={ref}
          data-token={DATA_TOKEN_BY_COLOR[effColor]}
          className={computedClasses}
          aria-busy={isLoading || undefined}
          // Do not forward `disabled` to non-button elements
          {...props}
        >
          {children as React.ReactElement}
        </Comp>
      );
    }

    const spinner = renderSpinner({ isLoading, iconSize });
    const leading = isLoading ? null : renderIcon({ icon: leadingIcon, className: "me-2", iconSize });
    const trailing = isLoading ? null : renderIcon({ icon: trailingIcon, className: "ms-2", iconSize });
    const content = renderContent({ iconOnly, children });

    // Default: render a real button with internal layout helpers
    return (
      <Comp
        ref={ref}
        data-token={DATA_TOKEN_BY_COLOR[effColor]}
        className={computedClasses}
        aria-busy={isLoading || undefined}
        disabled={isDisabled}
        {...props}
      >
        {spinner}
        {leading}
        {content}
        {trailing}
      </Comp>
    );
  },
);
Button.displayName = "Button";
