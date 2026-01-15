import type { SafeCount } from "../types/hooks/data/safeCountData";
import { sameItalyDate } from "./dateUtils";

export interface PartitionedSafeCounts {
  bankDrops: SafeCount[]; // records with type "bankDeposit"
  bankWithdrawals: SafeCount[]; // records with type "bankWithdrawal"
  deposits: SafeCount[];
  withdrawals: SafeCount[];
  pettyWithdrawals: SafeCount[];
  safeReconciles: SafeCount[];
  drawerToSafeExchanges: SafeCount[];
  safeToDrawerExchanges: SafeCount[];
}

/**
 * Partitions a list of SafeCount entries by type for a given date.
 * Only entries whose timestamp matches the provided date string
 * (YYYY-MM-DD) are included. Bank drops correspond to entries with
 * type "bankDeposit".
 */
export function partitionSafeCountsByType(
  safeCounts: SafeCount[],
  dateStr: string
): PartitionedSafeCounts {
  const result: PartitionedSafeCounts = {
    bankDrops: [],
    bankWithdrawals: [],
    deposits: [],
    withdrawals: [],
    pettyWithdrawals: [],
    safeReconciles: [],
    drawerToSafeExchanges: [],
    safeToDrawerExchanges: [],
  };

  for (const count of safeCounts) {
    if (!sameItalyDate(count.timestamp, dateStr)) continue;
    switch (count.type) {
      case "bankDeposit":
        result.bankDrops.push(count);
        break;
      case "bankWithdrawal":
        result.bankWithdrawals.push(count);
        break;
      case "deposit":
        result.deposits.push(count);
        break;
      case "withdrawal":
        result.withdrawals.push(count);
        break;
      case "pettyWithdrawal":
        result.pettyWithdrawals.push(count);
        break;
      case "safeReconcile":
        result.safeReconciles.push(count);
        break;
      case "exchange":
        if (count.direction === "drawerToSafe") {
          result.drawerToSafeExchanges.push(count);
        } else if (count.direction === "safeToDrawer") {
          result.safeToDrawerExchanges.push(count);
        }
        break;
    }
  }
  // Ensure each partition is sorted chronologically by timestamp
  for (const arr of Object.values(result) as SafeCount[][]) {
    arr.sort((a: SafeCount, b: SafeCount) =>
      a.timestamp.localeCompare(b.timestamp)
    );
  }

  return result;
}
