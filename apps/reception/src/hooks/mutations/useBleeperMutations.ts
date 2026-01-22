/* File: /src/hooks/mutations/useBleeperMutations.ts */

import { useCallback, useState } from "react";
import { ref, set } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type BleeperResult } from "../../types/bar/BleeperTypes";

export function useBleeperMutations() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  const setBleeperAvailability = useCallback(
    async (
      bleeperNumber: number,
      isAvailable: boolean
    ): Promise<BleeperResult> => {
      if (!database) {
        return { success: false, error: "Database not initialized" };
      }

      try {
        if (bleeperNumber < 1 || bleeperNumber > 18) {
          return {
            success: false,
            error: `Invalid bleeperNumber: ${bleeperNumber}. Must be 1..18.`,
          };
        }

        const singleBleeperRef = ref(database, `bleepers/${bleeperNumber}`);
        await set(singleBleeperRef, isAvailable);

        return {
          success: true,
          message: `Bleeper #${bleeperNumber} updated to ${
            isAvailable ? "available" : "in use"
          }.`,
        };
      } catch (err) {
        console.error(
          "[useBleeperMutations] setBleeperAvailability error:",
          err
        );
        setError(err);
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [database]
  );

  return {
    setBleeperAvailability,
    error,
  };
}
