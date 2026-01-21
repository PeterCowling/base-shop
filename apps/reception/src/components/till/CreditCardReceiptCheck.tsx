// src/components/till/CreditCardReceiptCheck.tsx

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useCCReceiptConfirmations } from "../../hooks/mutations/useCCReceiptConfirmations";
import { Transaction } from "../../types/component/Till";
import { formatEnGbDateTimeFromIso } from "../../utils/dateUtils";

interface CreditCardReceiptCheckProps {
  transactions: Transaction[];
  onCheckStatusChange: (allChecked: boolean) => void;
  initialCheckMap?: Record<string, boolean>;
  onMapChange?: (map: Record<string, boolean>) => void;
}

/**
 * Lists credit-card transactions and requires confirmation that each receipt
 * has been reconciled. The parent component is notified once every listed
 * transaction has been marked as confirmed.
 */
export const CreditCardReceiptCheck = memo(function CreditCardReceiptCheck({
  transactions,
  onCheckStatusChange,
  initialCheckMap,
  onMapChange,
}: CreditCardReceiptCheckProps) {
  /** Map of txnId → reconciliation status (true when confirmed). */
  const buildInitMap = (
    txns: Transaction[],
    initMap?: Record<string, boolean>
  ): Record<string, boolean> => {
    const init: Record<string, boolean> = {};
    for (const { txnId } of txns) {
      init[txnId] = initMap ? Boolean(initMap[txnId]) : false;
    }
    return init;
  };

  const [checkMap, setCheckMap] = useState<Record<string, boolean>>(() =>
    buildInitMap(transactions, initialCheckMap)
  );
  const { confirmReceipt } = useCCReceiptConfirmations();

  /* ------------------------------------------------------------------ */
  /* When the transaction list changes, (re)initialise the check map.   */
  /* ------------------------------------------------------------------ */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCheckMap(buildInitMap(transactions, initialCheckMap));
  }, [transactions, initialCheckMap]);

  /* ------------------------------------------------------------------ */
  /* Notify parent whenever the “all receipts confirmed” status changes. */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const allChecked = Object.values(checkMap).every(Boolean);
    onCheckStatusChange(allChecked);
    onMapChange?.(checkMap);
  }, [checkMap, onCheckStatusChange, onMapChange]);
  /* ------------------------------------------------------------------ */
  /* Memoised handler to update a single transaction’s status.          */
  /* ------------------------------------------------------------------ */
  const handleCheckChange = useCallback(
    (txnId: string, status: boolean) => {
      setCheckMap((prev) => ({ ...prev, [txnId]: status }));
      if (status) {
        confirmReceipt(txnId);
      }
    },
    [confirmReceipt]
  );

  const filteredTxns = transactions.filter((t) => t.amount !== 0);
  if (filteredTxns.length === 0) return null;

  return (
    <div className="mt-6 dark:text-darkAccentGreen">
      <h3 className="text-lg font-semibold mb-2 dark:text-darkAccentGreen">Credit Card Receipts</h3>

      <p className="mb-2 text-sm text-info-main dark:text-darkAccentGreen">
        Mark each credit card receipt as reconciled:
      </p>

      <ul className="space-y-1">
        {filteredTxns.map(({ txnId, timestamp, description, amount }) => {
          const displayDate = timestamp
            ? formatEnGbDateTimeFromIso(timestamp)
            : "N/A";

          return (
            <li
              key={txnId}
              className="flex flex-wrap items-center gap-3 border border-info-light p-2 rounded dark:border-darkSurface"
            >
              <label className="flex items-center gap-2 dark:text-darkAccentGreen">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={checkMap[txnId] || false}
                  onChange={(e) => handleCheckChange(txnId, e.target.checked)}
                />
                <span className="text-sm dark:text-darkAccentGreen">Reconciled</span>
              </label>
              <div className="text-sm text-info-dark dark:text-darkAccentGreen">
                <strong>{displayDate}:</strong> {description ?? "CC payment"}{" "}
                (Amount: €{amount.toFixed(2)})
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
