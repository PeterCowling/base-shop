import { memo, type ReactElement, useCallback, useMemo, useState } from "react";

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system";
import { SimpleModal } from "@acme/ui/molecules";

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
}: KeycardsModalProps): ReactElement {
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

  const handleTypeChange = useCallback((txnId: string, val: string) => {
    setEditedTypes((prev) => ({ ...prev, [txnId]: val as LoanMethod }));
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

  return (
    <SimpleModal
      isOpen={isOpen && !!occupant}
      onClose={onClose}
      title="Keycards on Loan"
      maxWidth="max-w-md"
    >
      <div className="space-y-2">
        <div className="text-sm text-foreground">
          {`${occupant?.firstName} ${occupant?.lastName} - Ref: ${occupant?.bookingRef}`}
        </div>
        {loading && <div className="italic text-muted-foreground ">Loading...</div>}
        {error && (
          <div className="text-error-main">Error loading keycards.</div>
        )}
        {!loading && !error && keycardTxns.length === 0 && (
          <div className="italic text-muted-foreground ">
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
                  <Select
                    value={current}
                    onValueChange={(val) => handleTypeChange(txn.id, val)}
                  >
                    <SelectTrigger className="border rounded px-2 py-1 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="PASSPORT">Passport</SelectItem>
                      <SelectItem value="LICENSE">License</SelectItem>
                      <SelectItem value="ID">ID</SelectItem>
                    </SelectContent>
                  </Select>
                  {current !== txn.depositType && (
                    <Button
                      onClick={() => handleSave(txn.id)}
                      className="bg-primary-main hover:bg-primary-dark text-primary-fg px-2 py-1 rounded"
                    >
                      Save
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SimpleModal>
  );
}

export const KeycardsModal = memo(KeycardsModalComponent);
export default KeycardsModal;
