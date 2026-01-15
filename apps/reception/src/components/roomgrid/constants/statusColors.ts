import type { MyLocalStatus } from "../../../types/MyLocalStatus";

/**
 * Centralized color map for booking and activity statuses.
 * All components should reference this constant to stay consistent.
 */
export const statusColors: Record<MyLocalStatus, string> = {
  free: "gray-200",
  disabled: "#ed6c02",
  awaiting: "info.light",
  confirmed: "info.light",
  "1": "#42a5f5",
  "8": "#1976d2",
  "23": "#ff9800",
  "12": "#4caf50",
  "14": "#DCDCDC",
  "16": "#7a807b",
};
