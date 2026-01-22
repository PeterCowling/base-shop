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
type IconSize = "sm" | "md" | "lg";

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
  iconSize?: IconSize;
  /** Render as square icon-only button (provide aria-label). */
  iconOnly?: boolean;
  asChild?: boolean;
  /** Size scale for padding/height/typography. */
  size?: ButtonSize;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const ICON_BOX_CLASSES: Record<IconSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const ICON_ONLY_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 w-9 p-0 justify-center",
  md: "h-10 w-10 p-0 justify-center",
  lg: "h-11 w-11 p-0 justify-center",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const LEGACY_MAP: Record<LegacyVariant, { color: ButtonColor; tone: ButtonTone }> = {
  default: { color: "primary", tone: "solid" },
  outline: { color: "accent", tone: "outline" },
  ghost: { color: "accent", tone: "ghost" },
  destructive: { color: "danger", tone: "solid" },
};

const SOLID_BG: Record<ButtonColor, string> = {
  default: "bg-muted text-fg hover:bg-muted/80",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
  info: "bg-info text-info-foreground hover:bg-info/90",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90",
};

const SOFT_BG: Record<ButtonColor, string> = {
  default: "bg-muted text-fg hover:bg-muted/70",
  primary: "bg-primary-soft text-fg hover:bg-primary/20",
  accent: "bg-accent-soft text-fg hover:bg-accent/20",
  success: "bg-success-soft text-fg hover:bg-success/20",
  info: "bg-info-soft text-fg hover:bg-info/20",
  warning: "bg-warning-soft text-fg hover:bg-warning/20",
  danger: "bg-danger-soft text-fg hover:bg-danger/20",
};

const OUTLINE_BG: Record<ButtonColor, string> = {
  default: "border border-border-2 text-fg hover:bg-surface-2",
  primary: "border border-border-2 text-fg hover:bg-primary-soft",
  accent: "border border-border-2 text-fg hover:bg-accent-soft",
  success: "border border-border-2 text-fg hover:bg-success-soft",
  info: "border border-border-2 text-fg hover:bg-info-soft",
  warning: "border border-border-2 text-fg hover:bg-warning-soft",
  danger: "border border-border-2 text-fg hover:bg-danger-soft",
};

const GHOST_BG: Record<ButtonColor, string> = {
  default: "text-fg hover:bg-surface-2",
  primary: "text-fg hover:bg-primary-soft",
  accent: "text-fg hover:bg-accent-soft",
  success: "text-fg hover:bg-success-soft",
  info: "text-fg hover:bg-info-soft",
  warning: "text-fg hover:bg-warning-soft",
  danger: "text-fg hover:bg-danger-soft",
};

const QUIET_BG: Record<ButtonColor, string> = {
  default: "text-fg hover:bg-transparent",
  primary: "text-primary hover:bg-primary-soft/50",
  accent: "text-accent hover:bg-accent-soft/50",
  success: "text-success hover:bg-success-soft/50",
  info: "text-info hover:bg-info-soft/50",
  warning: "text-warning hover:bg-warning-soft/50",
  danger: "text-danger hover:bg-danger-soft/50",
};

const CLASSES_BY_TONE: Record<ButtonTone, Record<ButtonColor, string>> = {
  solid: SOLID_BG,
  soft: SOFT_BG,
  outline: OUTLINE_BG,
  ghost: GHOST_BG,
  quiet: QUIET_BG,
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

function resolveColorAndTone(args: {
  variant: LegacyVariant;
  color?: ButtonColor;
  tone?: ButtonTone;
}): { color: ButtonColor; tone: ButtonTone } {
  const legacy = LEGACY_MAP[args.variant];
  return {
    color: args.color ?? legacy.color,
    tone: args.tone ?? legacy.tone,
  };
}

function isAriaBusy(ariaBusy: ButtonProps["aria-busy"]): boolean {
  if (ariaBusy === true) return true;
  if (typeof ariaBusy === "string") return ariaBusy !== "false";
  return false;
}

function getLegacyVariantClasses(args: {
  variant: LegacyVariant;
  color: ButtonColor;
}): string | undefined {
  if (args.variant === "outline") return "border-input";
  if (args.variant === "destructive") return "bg-destructive";
  if (args.variant === "ghost" && args.color === "accent") {
    return "hover:bg-accent hover:text-accent-foreground";
  }
  return undefined;
}

function ButtonSpinner(props: { show: boolean; iconSize: IconSize }) {
  if (!props.show) return null;
  return (
    <span
      className={cn(
        "me-2 inline-flex animate-spin rounded-full border-2 border-current border-t-transparent",
        ICON_BOX_CLASSES[props.iconSize],
      )}
      aria-hidden="true"
    />
  );
}

function ButtonIcon(props: {
  show: boolean;
  iconSize: IconSize;
  className: string;
  children: React.ReactNode;
}) {
  if (!props.show) return null;
  return (
    <span
      className={cn(
        props.className,
        "inline-flex items-center justify-center",
        ICON_BOX_CLASSES[props.iconSize],
      )}
      aria-hidden
    >
      {props.children}
    </span>
  );
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
    const resolved = resolveColorAndTone({ variant, color, tone });
    const isLoading = isAriaBusy(ariaBusy);
    const isDisabled = Boolean(disabled) || isLoading;
    const iconOnlyClass = iconOnly ? ICON_ONLY_CLASSES[size] : undefined;
    const computedClasses = cn(
      BASE_CLASSES,
      SIZE_CLASSES[size],
      CLASSES_BY_TONE[resolved.tone][resolved.color],
      getLegacyVariantClasses({ variant, color: resolved.color }),
      iconOnlyClass,
      isLoading ? "cursor-progress opacity-70" : undefined,
      className,
    );

    const Comp: React.ElementType = asChild ? Slot : "button";

    // When using asChild, Slot must receive exactly one valid element child.
    if (asChild) {
      return (
        <Comp
          ref={ref}
          data-token={DATA_TOKEN_BY_COLOR[resolved.color]}
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
        data-token={DATA_TOKEN_BY_COLOR[resolved.color]}
        className={computedClasses}
        aria-busy={isLoading || undefined}
        disabled={isDisabled}
        {...props}
      >
        <ButtonSpinner show={isLoading} iconSize={iconSize} />
        <ButtonIcon
          show={!isLoading && Boolean(leadingIcon)}
          iconSize={iconSize}
          className="me-2"
        >
          {leadingIcon}
        </ButtonIcon>
        {iconOnly ? <span className="sr-only">{children}</span> : children}
        <ButtonIcon
          show={!isLoading && Boolean(trailingIcon)}
          iconSize={iconSize}
          className="ms-2"
        >
          {trailingIcon}
        </ButtonIcon>
      </Comp>
    );
  },
);
Button.displayName = "Button";
