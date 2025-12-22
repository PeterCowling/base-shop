/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] class names and internal variants are not user-facing */
import React from "react";
import clsx from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "subtle" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ variant = "default", size = "md", className, ...rest }) => {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-brand-secondary text-brand-text",
    subtle: "bg-brand-primary/10 text-brand-primary",
    outline: "border border-brand-primary text-brand-primary",
  };
  const sizes: Record<NonNullable<BadgeProps["size"]>, string> = {
    sm: "text-xs px-2 py-0.5 rounded",
    md: "text-sm px-2.5 py-0.5 rounded-md",
  };
  return <span className={clsx("inline-flex items-center font-medium", variants[variant], sizes[size], className)} {...rest} />;
};

export default Badge;
