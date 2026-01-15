import { useMemo } from "react";

import { inventoryLedgerSchema } from "../../../schemas/inventoryLedgerSchema";
import type { InventoryLedgerEntry } from "../../../types/hooks/data/inventoryLedgerData";
import useFirebaseSubscription from "../useFirebaseSubscription";

export interface UseInventoryLedgerParams {
  itemId?: string;
}

export default function useInventoryLedger(params: UseInventoryLedgerParams = {}) {
  const { itemId } = params;
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, InventoryLedgerEntry>
  >("inventory/ledger", inventoryLedgerSchema);

  const entries = useMemo(() => {
    const mapped = Object.entries(data ?? {}).map(([id, entry]) => ({
      ...entry,
      id,
    }));
    const filtered = itemId
      ? mapped.filter((entry) => entry.itemId === itemId)
      : mapped;
    return filtered.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [data, itemId]);

  return useMemo(
    () => ({
      entries,
      loading,
      error,
    }),
    [entries, loading, error]
  );
}