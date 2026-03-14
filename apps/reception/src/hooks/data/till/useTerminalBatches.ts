import { useMemo } from "react";

import {
  type TerminalBatch,
  terminalBatchesSchema,
} from "../../../types/hooks/data/terminalBatchData";
import useFirebaseSubscription from "../useFirebaseSubscription";

export type TerminalBatchWithId = TerminalBatch & { id: string };

export default function useTerminalBatches() {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, TerminalBatch>
  >("reconciliation/terminalBatches", terminalBatchesSchema);

  const batches = useMemo<TerminalBatchWithId[]>(
    () =>
      data
        ? Object.entries(data).map(([id, batch]) => ({ id, ...batch }))
        : [],
    [data]
  );

  return { batches, loading, error };
}
