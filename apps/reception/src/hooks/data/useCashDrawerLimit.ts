import { useCallback } from "react";
import { ref, set } from "firebase/database";
import { z } from "zod";

import { useAuth } from "../../context/AuthContext";
import { logSettingChange } from "../../services/logSettingChange";
import { useFirebaseDatabase } from "../../services/useFirebase";

import useFirebaseSubscription from "./useFirebaseSubscription";

export function useCashDrawerLimit() {
  const { data: limit, loading, error } = useFirebaseSubscription<number>(
    "settings/cashDrawerLimit",
    z.number()
  );
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const updateLimit = useCallback(
    async (newLimit: number) => {
      await logSettingChange(database, {
        user: user?.user_name ?? "unknown",
        setting: "cashDrawerLimit",
        oldValue: limit ?? null,
        newValue: newLimit,
      });
      await set(ref(database, "settings/cashDrawerLimit"), newLimit);
    },
    [database, limit, user]
  );

  return { limit, loading, error, updateLimit };
}
