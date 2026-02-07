"use client";

/* eslint-disable ds/enforce-layout-primitives -- UI-9999 [ttl=2026-12-31] retention UI pending DS layout refactor */

import * as React from "react";

import { cn } from "../../../utils/style";
import { Tag } from "../../atoms";

export type MaterialsBreathabilitySpec = {
  label: string;
  value: string;
  badge?: string;
};

export interface MaterialsBreathabilitySpecsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  items: MaterialsBreathabilitySpec[];
}

export function MaterialsBreathabilitySpecs({
  title,
  items,
  className,
  ...props
}: MaterialsBreathabilitySpecsProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border-1 bg-surface-2 p-5", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className,
      )}
      {...props}
    >
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border-1 bg-surface-1 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">
                  {item.label}
                </div>
                <div className="text-sm text-muted-foreground">{item.value}</div>
              </div>
              {item.badge ? (
                <Tag size="sm" color="accent" tone="soft">
                  {item.badge}
                </Tag>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
