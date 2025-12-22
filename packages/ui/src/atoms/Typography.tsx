/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] typography class maps are not user-facing */
import React, { type ElementType } from "react";
import clsx from "clsx";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  align?: "left" | "center" | "right";
}

const headingSizes: Record<HeadingLevel, string> = {
  1: "text-3xl md:text-4xl font-semibold tracking-tight",
  2: "text-2xl md:text-3xl font-semibold tracking-tight",
  3: "text-xl md:text-2xl font-semibold",
  4: "text-lg md:text-xl font-semibold",
  5: "text-base md:text-lg font-medium",
  6: "text-sm md:text-base font-medium",
};

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export const Heading: React.FC<HeadingProps> = ({ level = 2, align = "left", className, ...rest }) => {
  const Comp = ("h" + level) as HeadingTag;
  const alignCls = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return <Comp className={clsx(headingSizes[level], alignCls, className)} {...rest} />;
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
