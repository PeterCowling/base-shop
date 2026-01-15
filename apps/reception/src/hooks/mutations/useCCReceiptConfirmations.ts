import { ref, set } from "firebase/database";
import { useCallback, useMemo } from "react";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { getItalyIsoString } from "../../utils/dateUtils";

export function useCCReceiptConfirmations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const confirmReceipt = useCallback(
    async (txnId: string) => {
      if (!user) {
        return;
      }
      try {
        const path = `ccReceiptConfirmations/${txnId}`;
        await set(ref(database, path), {
          user: user.user_name,
          timestamp: getItalyIsoString(),
        });
      } catch (err) {
        console.error("Error writing cc receipt confirmation:", err);
      }
    },
    [database, user]
  );

  return useMemo(() => ({ confirmReceipt }), [confirmReceipt]);
}
