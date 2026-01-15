import { push, ref, set } from "firebase/database";
import { useCallback, useMemo } from "react";

import { useAuth } from "../../context/AuthContext";
import { TIMESTAMP_KEY } from "../../constants/fields";
import { inventoryLedgerEntrySchema } from "../../schemas/inventoryLedgerSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type {
  InventoryLedgerEntry,
  InventoryLedgerEntryType,
} from "../../types/hooks/data/inventoryLedgerData";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { getStoredShiftId } from "../../utils/shiftId";
import { showToast } from "../../utils/toastUtils";

export function useInventoryLedgerMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const addLedgerEntry = useCallback(
    async (
      entry: Omit<InventoryLedgerEntry, "user" | typeof TIMESTAMP_KEY>
    ): Promise<void> => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      const newRef = push(ref(database, "inventory/ledger"));
      const payload: InventoryLedgerEntry = {
        ...entry,
        user: user.user_name,
        timestamp: getItalyIsoString(),
        shiftId: entry.shiftId ?? getStoredShiftId() ?? undefined,
      };
      const result = inventoryLedgerEntrySchema.safeParse(payload);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return;
      }
      await set(newRef, result.data);
    },
    [database, user]
  );

  const addAdjustment = useCallback(
    async (
      itemId: string,
      quantity: number,
      reason: string,
      note?: string,
      unit?: string
    ): Promise<void> => {
      return addLedgerEntry({
        itemId,
        type: "adjust",
        quantity,
        reason,
        note,
        unit,
      });
    },
    [addLedgerEntry]
  );

  const addReceipt = useCallback(
    async (
      itemId: string,
      quantity: number,
      reference?: string,
      unit?: string
    ): Promise<void> => {
      return addLedgerEntry({
        itemId,
        type: "receive",
        quantity,
        reference,
        unit,
      });
    },
    [addLedgerEntry]
  );

  const addWaste = useCallback(
    async (
      itemId: string,
      quantity: number,
      reason?: string,
      note?: string,
      unit?: string
    ): Promise<void> => {
      return addLedgerEntry({
        itemId,
        type: "waste",
        quantity,
        reason,
        note,
        unit,
      });
    },
    [addLedgerEntry]
  );

  const addCount = useCallback(
    async (
      itemId: string,
      quantity: number,
      note?: string,
      unit?: string
    ): Promise<void> => {
      return addLedgerEntry({
        itemId,
        type: "count",
        quantity,
        note,
        unit,
      });
    },
    [addLedgerEntry]
  );

  const addSale = useCallback(
    async (
      itemId: string,
      quantity: number,
      reference?: string,
      unit?: string,
      entryType: InventoryLedgerEntryType = "sale"
    ): Promise<void> => {
      return addLedgerEntry({
        itemId,
        type: entryType,
        quantity,
        reference,
        unit,
      });
    },
    [addLedgerEntry]
  );

  return useMemo(
    () => ({
      addLedgerEntry,
      addAdjustment,
      addReceipt,
      addWaste,
      addCount,
      addSale,
    }),
    [addLedgerEntry, addAdjustment, addReceipt, addWaste, addCount, addSale]
  );
}