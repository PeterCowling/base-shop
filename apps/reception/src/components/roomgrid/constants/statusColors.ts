import type { MyLocalStatus } from "../../../types/MyLocalStatus";

/**
 * Centralized color map for booking and activity statuses.
 * All components should reference this constant to stay consistent.
 * Uses CSS custom properties from reception semantic tokens.
 */
export const statusColors: Record<MyLocalStatus, string> = {
  free: "transparent",
  disabled: "var(--reception-signal-warning-fg)",
  awaiting: "var(--reception-signal-info-bg)",
  confirmed: "var(--reception-signal-info-fg)",
  "1": "var(--reception-signal-info-bg)",
  "8": "var(--reception-signal-info-fg)",
  "23": "var(--reception-signal-warning-fg)",
  "12": "var(--reception-signal-ready-fg)",
  "14": "var(--color-border)",
  "16": "var(--color-muted-foreground)",
};
