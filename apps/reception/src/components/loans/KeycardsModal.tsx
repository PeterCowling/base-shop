import { memo, type ReactElement, useCallback, useMemo, useState } from "react";

import { useLoanData } from "../../context/LoanDataContext";
import { type LoanMethod } from "../../types/hooks/data/loansData";

import useOccupantLoans from "./useOccupantLoans";

interface Occupant {
  guestId: string;
  bookingRef: string;
  firstName: string;
  lastName: string;
}

interface KeycardsModalProps {
  isOpen: boolean;
  occupant?: Occupant;
  onClose: () => void;
}

function KeycardsModalComponent({
  isOpen,
  occupant,
  onClose,
}: KeycardsModalProps): ReactElement | null {
  const { occupantLoans, loading, error } = useOccupantLoans(
    occupant?.bookingRef || "",
    occupant?.guestId || ""
  );

  const { updateLoanDepositType, convertKeycardDocToCash } = useLoanData();

  const keycardTxns = useMemo(() => {
    if (!occupantLoans?.txns)
      return [] as { id: string; depositType: LoanMethod }[];
    return Object.entries(occupantLoans.txns)
      .filter(([, txn]) => txn.item === "Keycard" && txn.type === "Loan")
      .flatMap(([id, txn]) =>
        Array.from({ length: txn.count }).map(() => ({
          id,
          depositType: txn.depositType,
        }))
      );
  }, [occupantLoans]);

  const [editedTypes, setEditedTypes] = useState<Record<string, LoanMethod>>(
    {}
  );

  const handleTypeChange = useCallback((txnId: string, value: LoanMethod) => {
    setEditedTypes((prev) => ({ ...prev, [txnId]: value }));
  }, []);

  const handleSave = useCallback(
    (txnId: string) => {
      if (!occupant) return;
      const newType = editedTypes[txnId];
      if (!newType) return;
      const currentTxn = occupantLoans?.txns?.[txnId];
      if (!currentTxn) return;

      const currentType = currentTxn.depositType;

      const promise =
        newType === "CASH" && currentType !== "CASH"
          ? convertKeycardDocToCash(
              occupant.bookingRef,
              occupant.guestId,
              txnId,
              currentTxn.count
            )
          : updateLoanDepositType(
              occupant.bookingRef,
              occupant.guestId,
              txnId,
              newType
            );

      promise.then(() => {
        setEditedTypes((prev) => {
          const next = { ...prev };
          delete next[txnId];
          return next;
        });
      });
    },
    [
      editedTypes,
      occupant,
      occupantLoans,
      updateLoanDepositType,
      convertKeycardDocToCash,
    ]
  );

  if (!isOpen || !occupant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md dark:bg-darkSurface">
        <div className="px-4 py-2 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg dark:text-darkAccentGreen">Keycards on Loan</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-600 hover:text-gray-700 dark:text-darkAccentGreen"
          >
            &times;
          </button>
        </div>
        <div className="p-4 space-y-2">
          <>
            <div className="text-sm text-gray-700 dark:text-darkAccentGreen">
              {`${occupant.firstName} ${occupant.lastName} - Ref: ${occupant.bookingRef}`}
            </div>
            {loading && <div className="italic text-gray-600 dark:text-darkAccentGreen">Loading...</div>}
            {error && (
              <div className="text-error-main">Error loading keycards.</div>
            )}
            {!loading && !error && keycardTxns.length === 0 && (
              <div className="italic text-gray-600 dark:text-darkAccentGreen">
                No keycards currently loaned.
              </div>
            )}
            {!loading && !error && keycardTxns.length > 0 && (
              <ul className="space-y-2">
                {keycardTxns.map((txn, idx) => {
                  const current = editedTypes[txn.id] ?? txn.depositType;
                  return (
                    <li
                      key={txn.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>Card {idx + 1}</span>
                      <select
                        value={current}
                        onChange={(e) =>
                          handleTypeChange(txn.id, e.target.value as LoanMethod)
                        }
                        className="border rounded px-2 py-1 flex-1 dark:bg-darkSurface dark:text-darkAccentGreen"
                      >
                        <option value="CASH">Cash</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="LICENSE">License</option>
                        <option value="ID">ID</option>
                      </select>
                      {current !== txn.depositType && (
                        <button
                          onClick={() => handleSave(txn.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                        >
                          Save
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        </div>
      </div>
    </div>
  );
}

export const KeycardsModal = memo(KeycardsModalComponent);
export default KeycardsModal;
