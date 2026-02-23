import { type FC, memo, useCallback, useState } from "react";
import { z } from "zod";

import { Button } from "@acme/design-system/atoms";
import { ReceptionInput, ReceptionTextarea } from "@acme/ui/operations";

import useCorrectTransaction from "../../hooks/mutations/useCorrectTransaction";
import { type Transaction } from "../../types/component/Till";
import { showToast } from "../../utils/toastUtils";
import PasswordReauthInline from "../common/PasswordReauthInline";

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
  const [reason, setReason] = useState<string>("");
  const { correctTransaction, loading, error } = useCorrectTransaction();

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
    if (!reason.trim()) {
      showToast("Correction reason is required", "error");
      return;
    }

    const {
      amount: parsedAmount,
      method: parsedMethod,
      itemCategory: parsedItemCategory,
      description: parsedDescription,
    } =
      validation.data;
    if (
      parsedAmount === undefined ||
      parsedMethod === undefined ||
      parsedItemCategory === undefined ||
      parsedDescription === undefined
    ) {
      showToast("Invalid transaction data", "error");
      return;
    }

    await correctTransaction(
      transaction.txnId,
      {
        amount: parsedAmount,
        method: parsedMethod,
        itemCategory: parsedItemCategory,
        description: parsedDescription,
      },
      reason.trim()
    );
    onClose();
  }, [
    amount,
    method,
    itemCategory,
    description,
    reason,
    transaction.txnId,
    correctTransaction,
    onClose,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground bg-opacity-50 p-4">
      <div className="bg-surface w-full max-w-sm p-6 rounded shadow-lg dark:bg-darkSurface dark:text-darkAccentGreen">
        <h2 className="text-lg font-semibold mb-4">Record Correction</h2>

        <label className="block mb-2">
          <span className="text-sm font-semibold">Amount</span>
          <ReceptionInput
            type="text"
            className="w-full border rounded p-1 text-foreground"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm font-semibold">Method</span>
          <ReceptionInput
            type="text"
            className="w-full border rounded p-1 text-foreground"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm font-semibold">Item Category</span>
          <ReceptionInput
            type="text"
            className="w-full border rounded p-1 text-foreground"
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-semibold">Description</span>
          <ReceptionInput
            type="text"
            className="w-full border rounded p-1 text-foreground"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-semibold">Correction Reason</span>
          <ReceptionTextarea
            className="w-full border rounded p-2 text-foreground"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </label>

        {Boolean(error) && (
          <p className="text-error-main text-sm mb-2">
            An error occurred. Please try again.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <PasswordReauthInline
            onSubmit={handleSave}
            submitLabel={loading ? "Saving..." : "Record correction"}
          />
          <Button
            onClick={onClose}
            className="px-4 py-2 rounded bg-surface-3 hover:bg-surface-3 text-foreground dark:bg-darkSurface dark:text-darkAccentGreen"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(EditTransactionModal);
