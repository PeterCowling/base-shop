"use client";

import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import { cn } from "../utils/style/cn";

export interface TrustCueProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

export function TrustCue({
  title,
  description,
  icon,
  className,
}: TrustCueProps) {
  return (
    <div
      role="note"
      aria-label={title}
      className={cn(
        "rounded-lg bg-surface-2 p-3 text-xs text-fg-muted",
        className,
      )}
    >
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-fg">
        <span aria-hidden="true" className="inline-flex">
          {icon ?? <ShieldCheck className="h-3.5 w-3.5" />}
        </span>
        <span>{title}</span>
      </div>
      <p>{description}</p>
    </div>
  );
}

export default TrustCue;
