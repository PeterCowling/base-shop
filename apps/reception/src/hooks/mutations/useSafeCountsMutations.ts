/* src/hooks/mutations/useSafeCountsMutations.ts */

import { useCallback, useMemo } from "react";
import { push, ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { safeCountSchema } from "../../schemas/safeCountSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type SafeCount, type SafeCountType } from "../../types/hooks/data/safeCountData";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { getStoredShiftId } from "../../utils/shiftId";
import { showToast } from "../../utils/toastUtils";

import {
  bankDeposit,
  bankWithdrawal,
  deposit as recordDeposit,
  exchange as recordExchange,
  withdraw as recordWithdrawal,
} from "./safeTransaction";

/**
 * This hook encapsulates all mutations (writes) for the safeCounts node in Firebase.
 */
export function useSafeCountsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  /**
   * Adds a new record to "safeCounts" in the Firebase database.
   */
  const addSafeCount = useCallback(
    async (
      type: SafeCountType,
      amount?: number,
      denomBreakdown?:
        | Record<string, number>
        | {
            incoming: Record<string, number>;
            outgoing: Record<string, number>;
          },
      keycardCount?: number,
      keycardDifference?: number,
      direction?: "drawerToSafe" | "safeToDrawer"
    ): Promise<void> => {
      if (!user) {
        console.error("No user is logged in; cannot add to safeCounts.");
        return;
      }

      try {
        const newCount: SafeCount = {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          type,
          amount,
          denomBreakdown,
          keycardCount,
          keycardDifference,
          direction,
          shiftId: getStoredShiftId() ?? undefined,
        };

        const parsed = safeCountSchema.safeParse(newCount);
        if (!parsed.success) {
          showToast(getErrorMessage(parsed.error), "error");
          return;
        }

        const newRef = push(ref(database, "safeCounts"));
        await set(newRef, parsed.data);
      } catch (error) {
        console.error("Error writing to safeCounts:", error);
        showToast("Failed to save safe count.", "error");
      }
    },
    [database, user]
  );

  const addDeposit = useCallback(
    async (
      amount: number,
      keycardCount: number,
      keycardDifference: number,
      denomBreakdown?: Record<string, number>
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

  const addOpening = useCallback(
    async (count: number, keycardCount: number): Promise<void> => {
      if (!user) {
        console.error("No user is logged in; cannot add to safeCounts.");
        return;
      }
      try {
        const newCount: SafeCount = {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          type: "opening",
          count,
          keycardCount,
          shiftId: getStoredShiftId() ?? undefined,
        };

        const parsed = safeCountSchema.safeParse(newCount);
        if (!parsed.success) {
          showToast(getErrorMessage(parsed.error), "error");
          return;
        }

        const newRef = push(ref(database, "safeCounts"));
        await set(newRef, parsed.data);
      } catch (error) {
        console.error("Error writing opening to safeCounts:", error);
        showToast("Failed to save safe count.", "error");
      }
    },
    [database, user]
  );

  const addReset = useCallback(
    async (
      count: number,
      keycardCount: number,
      keycardDifference: number,
      denomBreakdown: Record<string, number>
    ): Promise<void> => {
      if (!user) {
        console.error("No user is logged in; cannot add to safeCounts.");
        return;
      }
      try {
        const newCount: SafeCount = {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          type: "safeReset",
          count,
          keycardCount,
          keycardDifference,
          denomBreakdown,
          shiftId: getStoredShiftId() ?? undefined,
        };

        const parsed = safeCountSchema.safeParse(newCount);
        if (!parsed.success) {
          showToast(getErrorMessage(parsed.error), "error");
          return;
        }

        const newRef = push(ref(database, "safeCounts"));
        await set(newRef, parsed.data);
      } catch (error) {
        console.error("Error writing safe reset to safeCounts:", error);
        showToast("Failed to save safe count.", "error");
      }
    },
    [database, user]
  );

  const addWithdrawal = useCallback(
    async (
      amount: number,
      denomBreakdown?: Record<string, number>
    ): Promise<void> => {
      await recordWithdrawal(addSafeCount, amount, denomBreakdown);
    },
    [addSafeCount]
  );

  const addBankDeposit = useCallback(
    async (
      amount: number,
      keycardCount: number,
      keycardDifference: number,
      denomBreakdown?: Record<string, number>
    ): Promise<void> => {
      await bankDeposit(
        addSafeCount,
        amount,
        denomBreakdown,
        keycardCount,
        keycardDifference
      );
    },
    [addSafeCount]
  );

  const addBankWithdrawal = useCallback(
    async (
      amount: number,
      denomBreakdown?: Record<string, number>
    ): Promise<void> => {
      await bankWithdrawal(addSafeCount, amount, denomBreakdown);
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

  const addPettyWithdrawal = useCallback(
    async (amount: number): Promise<void> => {
      await addSafeCount("pettyWithdrawal", amount, undefined);
    },
    [addSafeCount]
  );

  const addReconcile = useCallback(
    async (
      count: number,
      difference: number,
      keycardCount: number,
      keycardDifference: number,
      denomBreakdown: Record<string, number>
    ): Promise<void> => {
      if (!user) {
        console.error("No user is logged in; cannot add to safeCounts.");
        return;
      }

      try {
        const newCount: SafeCount = {
          user: user.user_name,
          timestamp: getItalyIsoString(),
          type: "safeReconcile",
          count,
          difference,
          keycardCount,
          keycardDifference,
          denomBreakdown,
        };

        const parsed = safeCountSchema.safeParse(newCount);
        if (!parsed.success) {
          showToast(getErrorMessage(parsed.error), "error");
          return;
        }

        const newRef = push(ref(database, "safeCounts"));
        await set(newRef, parsed.data);
      } catch (error) {
        console.error("Error writing reconcile to safeCounts:", error);
        showToast("Failed to save safe count.", "error");
      }
    },
    [database, user]
  );

  return useMemo(
    () => ({
      addSafeCount,
      addDeposit,
      addWithdrawal,
      addBankDeposit,
      addBankWithdrawal,
      addExchange,
      addPettyWithdrawal,
      addOpening,
      addReset,
      addReconcile,
    }),
    [
      addSafeCount,
      addDeposit,
      addWithdrawal,
      addBankDeposit,
      addBankWithdrawal,
      addExchange,
      addPettyWithdrawal,
      addOpening,
      addReset,
      addReconcile,
    ]
  );
}
