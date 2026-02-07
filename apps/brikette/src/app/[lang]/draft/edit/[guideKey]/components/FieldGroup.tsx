"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import type { ReactNode } from "react";

import { Stack } from "@/components/ui/flex";

type FieldGroupProps = {
  label: string;
  children: ReactNode;
  description?: string;
};

export default function FieldGroup({ label, children, description }: FieldGroupProps) {
  return (
    <Stack className="gap-4 rounded-lg border border-brand-outline/20 bg-brand-surface/30 p-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-heading">{label}</h3>
        {description && (
          <p className="mt-1 text-xs text-brand-text/60">{description}</p>
        )}
      </div>
      <Stack className="gap-4">{children}</Stack>
    </Stack>
  );
}
