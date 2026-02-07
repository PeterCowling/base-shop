import { useMemo } from "react";

import { type Ticket } from "../../../types/bar/BarTypes";
import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * useCompletedData:
 * Subscribes to the "barOrders/completed" node in Firebase.
 * Returns a Record of Tickets keyed by orderNum (or null if none).
 */
export function useCompletedData(_props: Record<string, unknown> = {}): {
  completedData: Record<string, Ticket> | null;
  loading: boolean;
  error: unknown;
} {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, Ticket>
  >("barOrders/completed");

  const completedData = useMemo(() => data ?? null, [data]);

  return useMemo(
    () => ({ completedData, loading, error }),

    [completedData, loading, error]
  );
}
