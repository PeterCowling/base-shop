import { useCallback, useEffect, useMemo, useState } from "react";
import { type DataSnapshot, onValue, ref } from "firebase/database";

import { financialTransactionAuditSchema } from "../../schemas/financialTransactionAuditSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type {
  FinancialTransactionAudit,
  FinancialTransactionAudits,
} from "../../types/hooks/data/financialTransactionAudit";

export interface UseFinancialTransactionAuditsParams {
  createdBy?: string;
  bookingRef?: string;
  shiftId?: string;
  reason?: string;
  sourceTxnId?: string;
  skip?: boolean;
}

export default function useFinancialTransactionAuditsData({
  createdBy = "",
  bookingRef = "",
  shiftId = "",
  reason = "",
  sourceTxnId = "",
  skip = false,
}: UseFinancialTransactionAuditsParams = {}) {
  const database = useFirebaseDatabase();
  const [audits, setAudits] = useState<FinancialTransactionAudits>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  const handleDataChange = useCallback((snapshot: DataSnapshot) => {
    try {
      if (snapshot.exists()) {
        const raw = snapshot.val() as Record<string, unknown>;
        const valid: Record<string, FinancialTransactionAudit> = {};
        const errs: unknown[] = [];

        for (const [key, value] of Object.entries(raw)) {
          const parsed = financialTransactionAuditSchema.safeParse(value);
          if (parsed.success) {
            valid[key] = parsed.data as FinancialTransactionAudit;
          } else {
            errs.push(parsed.error);
          }
        }

        setAudits(valid);
        setError(errs.length > 0 ? errs : null);
      } else {
        setAudits({});
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleError = useCallback((err: unknown) => {
    setError(err);
    setLoading(false);
    console.error("[useFinancialTransactionAuditsData] Error fetching data");
  }, []);

  useEffect(() => {
    if (skip || !database) {
      setAudits({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const auditsRef = ref(database, "audit/financialTransactionAudits");
    const unsubscribe = onValue(auditsRef, handleDataChange, handleError);
    return unsubscribe;
  }, [database, handleDataChange, handleError, skip]);

  const filteredAudits = useMemo(() => {
    if (!audits) return [] as [string, FinancialTransactionAudit][];

    return Object.entries(audits).filter(([_, audit]) => {
      if (createdBy) {
        const name = audit.createdBy ?? "";
        if (!name.toLowerCase().includes(createdBy.toLowerCase())) {
          return false;
        }
      }
      if (bookingRef) {
        const beforeRef = audit.before.bookingRef ?? "";
        const afterRef = audit.after.bookingRef ?? "";
        const query = bookingRef.toLowerCase();
        if (
          !beforeRef.toLowerCase().includes(query) &&
          !afterRef.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (shiftId) {
        const shift = audit.shiftId ?? "";
        if (!shift.toLowerCase().includes(shiftId.toLowerCase())) {
          return false;
        }
      }
      if (sourceTxnId) {
        const source = audit.sourceTxnId ?? "";
        if (!source.toLowerCase().includes(sourceTxnId.toLowerCase())) {
          return false;
        }
      }
      if (reason) {
        const auditReason = audit.reason ?? "";
        if (!auditReason.toLowerCase().includes(reason.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [audits, bookingRef, createdBy, reason, shiftId, sourceTxnId]);

  return {
    audits,
    filteredAudits,
    loading,
    error,
  };
}
