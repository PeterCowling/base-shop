import { useCallback } from "react";
import { ref, runTransaction } from "firebase/database";
import { z } from "zod";

import { useAuth } from "../../context/AuthContext";
import { logSettingChange } from "../../services/logSettingChange";
import { useFirebaseDatabase } from "../../services/useFirebase";

import useFirebaseSubscription from "./useFirebaseSubscription";

export function useSafeKeycardCount() {
  const { data, loading, error } = useFirebaseSubscription<number>(
    "settings/safeKeycards",
    z.number()
  );
  const database = useFirebaseDatabase();
  const { user } = useAuth();
  const count = data ?? 0;

  const updateCount = useCallback(
    async (newCount: number) => {
      const countRef = ref(database, "settings/safeKeycards");
      let oldValue = 0;
      const result = await runTransaction(countRef, (current) => {
        oldValue = current ?? 0;
        return newCount;
      });

      if (result.committed) {
        const newValue = result.snapshot.val();
        console.debug(
          `Safe keycard count updated from ${oldValue} to ${newValue}`
        );
        await logSettingChange(database, {
          user: user?.user_name ?? "unknown",
          setting: "safeKeycards",
          oldValue,
          newValue,
        });
      }
    },
    [database, user]
  );

  return { count, loading, error, updateCount };
}
