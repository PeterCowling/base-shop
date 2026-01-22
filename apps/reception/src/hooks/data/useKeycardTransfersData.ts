import { useMemo } from "react";

import { type KeycardTransfer } from "../../types/hooks/data/keycardTransferData";

import useFirebaseSubscription from "./useFirebaseSubscription";

export function useKeycardTransfersData() {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, KeycardTransfer>
  >("keycardTransfers");

  const transfers = useMemo(() => {
    if (!data) return [] as KeycardTransfer[];
    return Object.values(data);
  }, [data]);

  return useMemo(() => ({ transfers, loading, error }), [
    transfers,
    loading,
    error,
  ]);
}
