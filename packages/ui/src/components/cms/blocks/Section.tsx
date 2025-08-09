"use client";
import type { ReactNode } from "react";

export interface SectionProps {
  children?: ReactNode;
  className?: string;
}

export default function Section({ children, className }: SectionProps) {
  return <div className={className}>{children}</div>;
}
