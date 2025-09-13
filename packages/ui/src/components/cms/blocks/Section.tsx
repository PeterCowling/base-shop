"use client";
import type { ReactNode, HTMLAttributes } from "react";

export interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Padding applied to the section */
  padding?: string;
  /** Background color for the section */
  backgroundColor?: string;
}

export default function Section({
  children,
  padding,
  backgroundColor,
  style,
  ...rest
}: SectionProps) {
  return (
    <div
      {...rest}
      style={{ ...style, padding, backgroundColor }}
    >
      {children}
    </div>
  );
}
