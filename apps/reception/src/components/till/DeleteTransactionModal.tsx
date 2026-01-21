import { FC, memo, useCallback } from "react";

import useDeleteTransaction from "../../hooks/mutations/useDeleteTransaction";
import { Transaction } from "../../types/component/Till";

interface DeleteTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const DeleteTransactionModal: FC<DeleteTransactionModalProps> = ({
  transaction,
  onClose,
}) => {
  const { deleteTransaction, loading, error } = useDeleteTransaction();

  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteTransaction(transaction.txnId);
      onClose();
    } catch (err) {
      console.error("[DeleteTransactionModal] Deletion error:", err);
    }
  }, [transaction.txnId, deleteTransaction, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white w-full max-w-sm p-6 rounded shadow-lg dark:bg-darkSurface">
        <h2 className="text-lg font-semibold mb-4 dark:text-darkAccentGreen">Confirm Deletion</h2>
        <p className="mb-4">
          Are you sure you want to delete transaction{" "}
          <strong>{transaction.description || transaction.txnId}</strong>?
        </p>
        <p className="text-red-600 text-sm mb-6">
          This action cannot be undone.
        </p>
        {Boolean(error) && (
          <p className="text-red-500 text-sm mb-4">
            An error occurred while deleting. Please try again.
          </p>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-darkSurface dark:text-darkAccentGreen"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={loading}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(DeleteTransactionModal);
