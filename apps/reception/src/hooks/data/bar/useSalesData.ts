// File: /src/hooks/data/bar/useSalesData.ts

import { useMemo } from "react";

import { type Ticket } from "../../../types/bar/BarTypes";
import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * useSalesData:
 * Subscribes to the "barOrders/sales" node in Firebase.
 * Returns a Record of Tickets keyed by their orderNum (or null if none).
 */
export function useSalesData(): {
  salesData: Record<string, Ticket> | null;
  loading: boolean;
  error: unknown;
} {
  const { data, loading, error } =
    useFirebaseSubscription<Record<string, Ticket>>("barOrders/sales");

  const salesData = useMemo(() => data ?? null, [data]);

  return useMemo(
    () => ({
      salesData,
      loading,
      error,
    }),
    [salesData, loading, error]
  );
}
