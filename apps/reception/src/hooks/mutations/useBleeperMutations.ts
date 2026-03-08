/* File: /src/hooks/mutations/useBleeperMutations.ts */

import { useCallback } from "react";
import { ref, set } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type BleeperResult } from "../../types/bar/BleeperTypes";
import type { MutationState } from "../../types/hooks/mutations/mutationState";

import useMutationState from "./useMutationState";

interface UseBleeperMutationsReturn extends MutationState<void> {
  setBleeperAvailability: (
    bleeperNumber: number,
    isAvailable: boolean
  ) => Promise<BleeperResult>;
}

export function useBleeperMutations(): UseBleeperMutationsReturn {
  const database = useFirebaseDatabase();
  // Manual variant: setBleeperAvailability returns BleeperResult (structured result),
  // not void/throw — cannot use run() wrapper directly.
  const { loading, error, setLoading, setError } = useMutationState();

  const setBleeperAvailability = useCallback(
    async (
      bleeperNumber: number,
      isAvailable: boolean
    ): Promise<BleeperResult> => {
      if (!database) {
        return { success: false, error: "Database not initialized" };
      }

      setLoading(true);
      setError(null);

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
      } finally {
        setLoading(false);
      }
    },
    [database, setLoading, setError]
  );

  return {
    setBleeperAvailability,
    error,
    loading,
  };
}
