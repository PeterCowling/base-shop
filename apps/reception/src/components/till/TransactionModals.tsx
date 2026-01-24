import type { FC } from "react";

import type { Transaction } from "../../types/component/Till";

import EditTransactionModal from "./EditTransactionModal";
import VoidTransactionModal from "./VoidTransactionModal";

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
      <VoidTransactionModal
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
