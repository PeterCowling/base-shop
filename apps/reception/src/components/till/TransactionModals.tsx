import type { FC } from "react";

import type { Transaction } from "../../types/component/Till";

import DeleteTransactionModal from "./DeleteTransactionModal";
import EditTransactionModal from "./EditTransactionModal";

interface TransactionModalsProps {
  txnToDelete: Transaction | null;
  txnToEdit: Transaction | null;
  setTxnToDelete: (t: Transaction | null) => void;
  setTxnToEdit: (t: Transaction | null) => void;
}

const TransactionModals: FC<TransactionModalsProps> = ({
  txnToDelete,
  txnToEdit,
  setTxnToDelete,
  setTxnToEdit,
}) => (
  <>
    {txnToDelete && (
      <DeleteTransactionModal
        transaction={txnToDelete}
        onClose={() => setTxnToDelete(null)}
      />
    )}
    {txnToEdit && (
      <EditTransactionModal
        transaction={txnToEdit}
        onClose={() => setTxnToEdit(null)}
      />
    )}
  </>
);

export default TransactionModals;
