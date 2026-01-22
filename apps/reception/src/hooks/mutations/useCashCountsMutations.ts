/* src/hooks/mutations/useCashCountsMutations.ts */

import { useCallback, useMemo } from "react";
import { push, ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { cashCountSchema } from "../../schemas/cashCountSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type CashCount, type CashCountType } from "../../types/hooks/data/cashCountData";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

import {
  deposit as recordDeposit,
  exchange as recordExchange,
} from "./safeTransaction";
import { useSafeCountsMutations } from "./useSafeCountsMutations";

/**
 * This hook encapsulates all mutations (writes) for the cashCounts node in Firebase.
 */
export function useCashCountsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();
  const { addSafeCount } = useSafeCountsMutations();

  /**
   * Adds a new record to "cashCounts" in the Firebase database.
   *
   * For "opening", "close" and "reconcile" types this stores the full cash count
   * and difference. For the "float" type only `amount` is stored.
   */
  const addCashCount = useCallback(
    async (
      type: CashCountType,
      count: number,
      difference: number,
      amount?: number,
      denomBreakdown?: Record<string, number>,
      keycardCount?: number
    ): Promise<void> => {
      if (!user) {
        console.error("No user is logged in; cannot add to cashCounts.");
        return;
      }

      try {
        // Create a new entry in the "cashCounts" node
        const newRef = push(ref(database, "cashCounts"));

        const newCount: CashCount = {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          type,
          count,
          difference,
          amount,
          denomBreakdown,
          keycardCount,
        };

        const result = cashCountSchema.safeParse(newCount);
        if (!result.success) {
          console.error("Invalid cash count data", result.error);
          showToast(getErrorMessage(result.error), "error");
          return Promise.reject(result.error);
        }

        await set(newRef, result.data);
      } catch (error) {
        console.error("Error writing to cashCounts:", error);
        showToast("Failed to save cash count.", "error");
      }
    },
    [database, user]
  );

  const addDeposit = useCallback(
    async (
      amount: number,
      denomBreakdown?: Record<string, number>,
      keycardCount?: number,
      keycardDifference?: number
    ): Promise<void> => {
      await recordDeposit(
        addSafeCount,
        amount,
        denomBreakdown,
        keycardCount,
        keycardDifference
      );
    },
    [addSafeCount]
  );

  const addWithdrawal = useCallback(
    async (
      amount: number,
      denomBreakdown?: Record<string, number>
    ): Promise<void> => {
      await addSafeCount("withdrawal", amount, denomBreakdown);
    },
    [addSafeCount]
  );

  const addExchange = useCallback(
    async (
      outgoing: Record<string, number>,
      incoming: Record<string, number>,
      direction: "drawerToSafe" | "safeToDrawer",
      total: number
    ): Promise<void> => {
      await recordExchange(addSafeCount, outgoing, incoming, total, direction);
    },
    [addSafeCount]
  );

  /**
   * Convenience wrapper for adding a float entry.
   */
  const addFloatEntry = useCallback(
    async (amount: number): Promise<void> => {
      await addCashCount("float", 0, 0, amount);
    },
    [addCashCount]
  );

  return useMemo(
    () => ({
      addCashCount,
      addFloatEntry,
      addDeposit,
      addWithdrawal,
      addExchange,
    }),
    [addCashCount, addFloatEntry, addDeposit, addWithdrawal, addExchange]
  );
}
