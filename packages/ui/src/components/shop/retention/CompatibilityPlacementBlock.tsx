"use client";

import * as React from "react";
import { cn } from "../../../utils/style";

export type CompatibilityPlacementTip = {
  label: string;
  description: string;
};

export interface CompatibilityPlacementBlockProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  summary: string;
  tips?: CompatibilityPlacementTip[];
}

export function CompatibilityPlacementBlock({
  title,
  summary,
  tips = [],
  className,
  ...props
}: CompatibilityPlacementBlockProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border-1 bg-surface-2 p-5", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className,
      )}
      {...props}
    >
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
      {tips.length ? (
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip.label} className="rounded-2xl border border-border-1 bg-surface-1 p-4">
              <div className="font-semibold text-foreground">{tip.label}</div>
              <div className="mt-1">{tip.description}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

