import { useCallback, useState } from "react";
import { get, ref, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type FinancialTransaction } from "../../types/hooks/data/allFinancialTransaction";
import { type FinancialTransactionAudit } from "../../types/hooks/data/financialTransactionAudit";
import { getItalyIsoString } from "../../utils/dateUtils";
import { generateTransactionId } from "../../utils/generateTransactionId";
import { getStoredShiftId } from "../../utils/shiftId";

import useFinancialsRoomMutations from "./useFinancialsRoomMutations";

export interface CorrectionUpdates {
  amount: number;
  method: string;
  itemCategory: string;
  description: string;
}

const stripVoids = (txn: FinancialTransaction): FinancialTransaction => {
  const {
    voidedAt: _voidedAt,
    voidedBy: _voidedBy,
    voidedByUid: _voidedByUid,
    voidReason: _voidReason,
    voidedShiftId: _voidedShiftId,
    ...rest
  } = txn;
  return rest;
};

export default function useCorrectTransaction() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();
  const { saveFinancialsRoom } = useFinancialsRoomMutations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const correctTransaction = useCallback(
    async (
      txnId: string,
      updates: CorrectionUpdates,
      reason: string
    ): Promise<void> => {
      if (!database) {
        setError("Database not initialized.");
        return;
      }
      if (!user) {
        setError("Not authorized.");
        return;
      }
      if (!reason.trim()) {
        setError("Correction reason is required.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const txnRef = ref(database, `allFinancialTransactions/${txnId}`);
        const snap = await get(txnRef);
        if (!snap.exists()) {
          setLoading(false);
          return;
        }
        const existing = snap.val() as FinancialTransaction;
        if (existing.voidedAt || existing.voidedBy || existing.voidReason) {
          setError("Cannot correct a voided transaction.");
          return;
        }

        const now = getItalyIsoString();
        const shiftId = getStoredShiftId() ?? undefined;
        const correctedBy = user.user_name ?? "unknown";
        const correctedByUid = user.uid ?? undefined;

        const base = stripVoids(existing);
        const corrected: FinancialTransaction = {
          ...base,
          ...updates,
          timestamp: now,
          user_name: correctedBy,
          shiftId,
        };

        const reversalId = generateTransactionId();
        const replacementId = generateTransactionId();
        const auditId = generateTransactionId();

        const correctionMeta = {
          sourceTxnId: txnId,
          correctionReason: reason.trim(),
          correctionKind: "reversal" as const,
          correctedBy,
          correctedByUid,
          correctedShiftId: shiftId,
        };

        const reversal: FinancialTransaction = {
          ...base,
          amount: -existing.amount,
          type: "correction",
          timestamp: now,
          user_name: correctedBy,
          shiftId,
          ...correctionMeta,
        };

        const replacement: FinancialTransaction = {
          ...base,
          ...updates,
          type: existing.type,
          timestamp: now,
          user_name: correctedBy,
          shiftId,
          sourceTxnId: txnId,
          correctionReason: reason.trim(),
          correctionKind: "replacement",
          correctedBy,
          correctedByUid,
          correctedShiftId: shiftId,
        };

        const auditRecord: FinancialTransactionAudit = {
          sourceTxnId: txnId,
          createdAt: now,
          createdBy: correctedBy,
          createdByUid: correctedByUid,
          shiftId,
          reason: reason.trim(),
          before: existing,
          after: corrected,
          correctionTxnIds: [reversalId, replacementId],
        };

        await update(ref(database), {
          [`allFinancialTransactions/${reversalId}`]: reversal,
          [`allFinancialTransactions/${replacementId}`]: replacement,
          [`audit/financialTransactionAudits/${auditId}`]: auditRecord,
        });

        if (existing.bookingRef) {
          await saveFinancialsRoom(existing.bookingRef, {
            transactions: {
              [reversalId]: {
                bookingRef: existing.bookingRef,
                occupantId: existing.occupantId,
                amount: -existing.amount,
                nonRefundable: existing.nonRefundable ?? false,
                timestamp: now,
                type: existing.type,
                shiftId,
                sourceTxnId: txnId,
                correctionReason: reason.trim(),
                correctionKind: "reversal",
                correctedBy,
                correctedByUid,
                correctedShiftId: shiftId,
              },
              [replacementId]: {
                bookingRef: existing.bookingRef,
                occupantId: existing.occupantId,
                amount: updates.amount,
                nonRefundable: existing.nonRefundable ?? false,
                timestamp: now,
                type: existing.type,
                shiftId,
                sourceTxnId: txnId,
                correctionReason: reason.trim(),
                correctionKind: "replacement",
                correctedBy,
                correctedByUid,
                correctedShiftId: shiftId,
              },
            },
          });
        }
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [database, user, saveFinancialsRoom]
  );

  return { correctTransaction, loading, error };
}
