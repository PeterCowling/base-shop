/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] typography class maps are not user-facing */
import React, { type ElementType } from "react";
import clsx from "clsx";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  align?: "left" | "center" | "right";
}

/**
 * Heading size map.
 * Display-level headings (1-4) use profile-driven font-weight via
 * `--profile-type-display-weight` with fallback to the current hardcoded value.
 * This is applied as an inline style so the Tailwind font-weight class acts as
 * the visual default when no profile CSS is loaded.
 */
const headingSizes: Record<HeadingLevel, string> = {
  1: "text-3xl md:text-4xl font-semibold tracking-tight",
  2: "text-2xl md:text-3xl font-semibold tracking-tight",
  3: "text-xl md:text-2xl font-semibold",
  4: "text-lg md:text-xl font-semibold",
  5: "text-base md:text-lg font-medium",
  6: "text-sm md:text-base font-medium",
};

/** Heading levels 1-4 are considered "display" and receive profile weight overrides. */
const isDisplayLevel = (level: HeadingLevel): boolean => level <= 4;

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export const Heading: React.FC<HeadingProps> = ({ level = 2, align = "left", className, style, ...rest }) => {
  const Comp = ("h" + level) as HeadingTag;
  const alignCls = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  // Profile-driven display weight for display-level headings (1-4).
  // Fallback matches the Tailwind font-semibold (600) / font-medium (500) defaults.
  const profileStyle: React.CSSProperties | undefined = isDisplayLevel(level)
    ? { fontWeight: "var(--profile-type-display-weight, 600)" as unknown as number, ...style }
    : style;
  return <Comp className={clsx(headingSizes[level], alignCls, className)} style={profileStyle} {...rest} />;
};

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: "sm" | "md" | "lg";
  muted?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const textSizes: Record<NonNullable<TextProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export const Text: React.FC<TextProps> = ({ as = "p", size = "md", muted = false, className, ...rest }) => {
  const Comp = as as ElementType;
  return <Comp className={clsx(textSizes[size], muted && "text-muted-foreground", className)} {...rest} />;
};

const Typography = { Heading, Text };

export default Typography;
