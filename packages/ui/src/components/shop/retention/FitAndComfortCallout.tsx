"use client";

import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "../../../utils/style";

export type FitAndComfortItem = {
  label: string;
  description?: string;
};

export interface FitAndComfortCalloutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  items: FitAndComfortItem[];
}

export function FitAndComfortCallout({
  title,
  items,
  className,
  ...props
}: FitAndComfortCalloutProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border-1 bg-surface-2 p-5", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className,
      )}
      {...props}
    >
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border-2 bg-surface-1"
            >
              <CheckIcon className="h-4 w-4 text-foreground" />
            </span>
            <div>
              <div className="font-semibold text-foreground">{item.label}</div>
              {item.description ? (
                <div className="mt-0.5">{item.description}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

