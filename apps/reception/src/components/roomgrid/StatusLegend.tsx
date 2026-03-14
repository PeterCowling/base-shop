// File: src/components/roomgrid/StatusLegend.tsx
import type { FC } from "react";

import { Cluster, Inline } from "@acme/design-system/primitives";

/**
 * Compact colour legend for the rooms grid.
 * Each swatch mirrors the exact CSS variable used in statusColors.ts so the
 * legend stays in sync with the actual cell colours automatically.
 */

const LEGEND_ENTRIES: { label: string; color: string }[] = [
  { label: "Booking recorded", color: "var(--reception-signal-info-bg)" },
  { label: "Room paid", color: "var(--reception-signal-info-fg)" },
  { label: "Bags dropped", color: "var(--reception-signal-warning-fg)" },
  { label: "Checked in", color: "var(--reception-grid-checkedin-fill)" },
  { label: "Keys returned", color: "hsl(var(--color-border))" },
  { label: "Checked out", color: "hsl(var(--color-fg-muted))" },
  { label: "Short gap", color: "hsl(40 90% 85%)" },
];

const StatusLegend: FC = () => (
  <Cluster className="gap-x-4 gap-y-1.5 px-1 py-1">
    {LEGEND_ENTRIES.map(({ label, color }) => (
      <Inline key={label} className="gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-sm border border-border-2 shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-xs text-muted-foreground">{label}</span>
      </Inline>
    ))}
  </Cluster>
);

export default StatusLegend;
