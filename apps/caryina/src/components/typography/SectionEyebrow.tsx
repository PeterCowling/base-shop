import type { ReactNode } from "react";

type SectionEyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  const classes = className
    ? `text-xs uppercase tracking-widest text-accent ${className}`
    : "text-xs uppercase tracking-widest text-accent";

  return <p className={classes}>{children}</p>;
}
