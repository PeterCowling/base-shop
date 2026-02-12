import { useMemo } from "react";

import {
  type TerminalBatch,
  terminalBatchesSchema,
} from "../../../types/hooks/data/terminalBatchData";
import useFirebaseSubscription from "../useFirebaseSubscription";

export default function useTerminalBatches() {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, TerminalBatch>
  >("reconciliation/terminalBatches", terminalBatchesSchema);

  const batches = useMemo<TerminalBatch[]>(
    () => (data ? Object.values(data) : []),
    [data]
  );

  return { batches, loading, error };
}
