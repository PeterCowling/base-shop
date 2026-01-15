import type { CashCount } from "../types/hooks/data/cashCountData";

/**
 * Returns the most recent opening record that has not been matched by a close.
 * `undefined` indicates there is no open shift.
 */
export function findOpenShift(cashCounts: CashCount[]): CashCount | undefined {
  const sorted = [...cashCounts].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  let currentOpen: CashCount | undefined;
  for (const record of sorted) {
    if (record.type === "opening") {
      currentOpen = record;
    } else if (record.type === "close") {
      currentOpen = undefined;
    }
    // "reconcile" deliberately ignored
  }
  return currentOpen;
}
