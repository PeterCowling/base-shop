import { type FC, memo, useCallback, useState } from "react";

import useVoidTransaction from "../../hooks/mutations/useVoidTransaction";
import { type Transaction } from "../../types/component/Till";
import { showToast } from "../../utils/toastUtils";
import PasswordReauthInline from "../common/PasswordReauthInline";

interface VoidTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const VoidTransactionModal: FC<VoidTransactionModalProps> = ({
  transaction,
  onClose,
}) => {
  const { voidTransaction, loading, error } = useVoidTransaction();
  const [reason, setReason] = useState("");

  const handleVoid = useCallback(async () => {
    if (!reason.trim()) {
      showToast("Void reason is required.", "error");
      return;
    }
    try {
      await voidTransaction(transaction.txnId, reason.trim());
      onClose();
    } catch (err) {
      console.error("[VoidTransactionModal] Void error:", err);
    }
  }, [voidTransaction, transaction.txnId, reason, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white w-full max-w-sm p-6 rounded shadow-lg dark:bg-darkSurface">
        <h2 className="text-lg font-semibold mb-4 dark:text-darkAccentGreen">
          Void Transaction
        </h2>
        <p className="mb-4">
          Are you sure you want to void transaction{" "}
          <strong>{transaction.description || transaction.txnId}</strong>?
        </p>
        <label className="block text-sm font-semibold mb-2">
          Reason
          <textarea
            className="mt-1 w-full rounded border p-2 text-sm text-gray-900"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this transaction being voided?"
          />
        </label>
        <p className="text-red-600 text-sm mb-4">
          This action cannot be undone.
        </p>
        {Boolean(error) && (
          <p className="text-red-500 text-sm mb-4">
            An error occurred while voiding. Please try again.
          </p>
        )}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-darkSurface dark:text-darkAccentGreen"
          >
            Cancel
          </button>
        </div>
        <PasswordReauthInline
          onSubmit={handleVoid}
          submitLabel={loading ? "Voiding..." : "Confirm Void"}
        />
      </div>
    </div>
  );
};

export default memo(VoidTransactionModal);
