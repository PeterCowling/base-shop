// File: /src/hooks/data/bar/useFinManLogsData.ts

import { useMemo } from "react";

import useFirebaseSubscription from "../useFirebaseSubscription";
/**
 * Shape of the finance log entry. If you need more fields, adjust accordingly.
 */
export interface FinManLogEntry {
  salesDetails: string;
  salesPrice: number;
  userName: string;
  transType: string;
  bleep: string;
  timestamp: string;
}

/**
 * useFinManLogsData:
 * Subscribes to the "barOrders/finManLogs" node in Firebase.
 * Returns a Record keyed by auto-generated log IDs.
 */
export function useFinManLogsData(): {
  finManLogs: Record<string, FinManLogEntry> | null;
  loading: boolean;
  error: unknown;
} {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, FinManLogEntry>
  >("barOrders/finManLogs");
  const finManLogs = useMemo(() => data ?? null, [data]);

  return useMemo(
    () => ({ finManLogs, loading, error }),

    [finManLogs, loading, error]
  );
}
