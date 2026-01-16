import { useCallback } from "react";
import { push, ref, set } from "firebase/database";

import { useAuth } from "../context/AuthContext";
import { useFirebaseDatabase } from "../services/useFirebase";
import { getItalyIsoString } from "../utils/dateUtils";
import type { KeycardTransfer } from "../types/hooks/data/keycardTransferData";

export function useKeycardTransfer() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  return useCallback(
    async (count: number, direction: "fromSafe" | "toSafe") => {
      if (!user) {
        throw new Error("No authenticated user");
      }
      const newRef = push(ref(database, "keycardTransfers"));
      const data: KeycardTransfer = {
        user: user.user_name,
        timestamp: getItalyIsoString(),
        count,
        direction,
      };
      await set(newRef, data);
    },
    [database, user]
  );
}
