import { CashCount } from "../../../types/hooks/data/cashCountData";
export { findOpenShift } from "../../../utils/shiftUtils";

export function getLastClose(cashCounts: CashCount[]): CashCount | undefined {
  const closeRecords = cashCounts.filter((c) => c.type === "close");
  if (closeRecords.length === 0) return undefined;
  return closeRecords[closeRecords.length - 1];
}
