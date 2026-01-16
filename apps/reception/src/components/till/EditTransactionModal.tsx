import { FC, memo, useCallback, useState } from "react";
import { z } from "zod";

import useEditTransaction from "../../hooks/mutations/useEditTransaction";
import { Transaction } from "../../types/component/Till";
import { showToast } from "../../utils/toastUtils";

const editSchema = z.object({
  amount: z.number(),
  method: z.string().min(1),
  itemCategory: z.string().min(1),
  description: z.string().min(1),
});

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const EditTransactionModal: FC<EditTransactionModalProps> = ({
  transaction,
  onClose,
}) => {
  const [amount, setAmount] = useState<string>(transaction.amount.toString());
  const [method, setMethod] = useState<string>(transaction.method || "");
  const [itemCategory, setItemCategory] = useState<string>(
    transaction.itemCategory || ""
  );
  const [description, setDescription] = useState<string>(
    transaction.description || ""
  );
  const { editTransaction, loading, error } = useEditTransaction();

  const handleSave = useCallback(async () => {
    const validation = editSchema.safeParse({
      amount: parseFloat(amount),
      method,
      itemCategory,
      description,
    });
    if (!validation.success) {
      showToast(
        validation.error.errors[0]?.message ?? "Invalid transaction",
        "error"
      );
      return;
    }

    await editTransaction(transaction.txnId, validation.data);
    onClose();
  }, [
    amount,
    method,
    itemCategory,
    description,
    transaction.txnId,
    editTransaction,
    onClose,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white w-full max-w-sm p-6 rounded shadow-lg dark:bg-darkSurface dark:text-darkAccentGreen">
        <h2 className="text-lg font-semibold mb-4">Edit Transaction</h2>

        <label className="block mb-2">
          <span className="text-sm font-semibold">Amount</span>
          <input
            type="text"
            className="w-full border rounded p-1 text-gray-900"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm font-semibold">Method</span>
          <input
            type="text"
            className="w-full border rounded p-1 text-gray-900"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm font-semibold">Item Category</span>
          <input
            type="text"
            className="w-full border rounded p-1 text-gray-900"
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-semibold">Description</span>
          <input
            type="text"
            className="w-full border rounded p-1 text-gray-900"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {Boolean(error) && (
          <p className="text-red-500 text-sm mb-2">
            An error occurred. Please try again.
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
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded bg-primary-main hover:bg-primary-dark text-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(EditTransactionModal);
