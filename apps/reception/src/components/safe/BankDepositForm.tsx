import { memo, useState } from "react";

import { showToast } from "../../utils/toastUtils";
import { PasswordReauthInline } from "../common/PasswordReauthInline";

export interface BankDepositFormProps {
  currentKeycards: number;
  onConfirm: (
    amount: number,
    keycardCount: number,
    keycardDifference: number
  ) => void;
  onCancel: () => void;
}

export const BankDepositForm = memo(function BankDepositForm({
  currentKeycards,
  onConfirm,
  onCancel,
}: BankDepositFormProps) {
  const [amount, setAmount] = useState("");
  const [keycardInput, setKeycardInput] = useState("");

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    const keycardDiff = keycardInput ? parseInt(keycardInput, 10) : 0;
    if (keycardInput && isNaN(keycardDiff)) {
      showToast("Please enter a valid keycard count", "error");
      return;
    }

    const newKeycardCount = currentKeycards + keycardDiff;
    onConfirm(parsedAmount, newKeycardCount, keycardDiff);
  };

  return (
    <div className="border-2 border-primary-main rounded-lg p-4 mt-4">
      <h3 className="text-lg font-semibold text-primary-main mb-4">
        Bank Deposit
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Record cash taken from the safe to deposit at the bank.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="bankDeposit_amount"
            className="block text-sm font-medium mb-1"
          >
            Amount (€)
          </label>
          <input
            id="bankDeposit_amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main dark:bg-darkSurface dark:border-gray-600"
            placeholder="0.00"
          />
        </div>

        <div>
          <label
            htmlFor="bankDeposit_keycards"
            className="block text-sm font-medium mb-1"
          >
            Keycards Deposited (optional)
          </label>
          <input
            id="bankDeposit_keycards"
            type="number"
            step="1"
            value={keycardInput}
            onChange={(e) => setKeycardInput(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main dark:bg-darkSurface dark:border-gray-600"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current keycards in safe: {currentKeycards}
          </p>
        </div>

        <div className="mt-5">
          <PasswordReauthInline onSubmit={handleSubmit} submitLabel="Deposit" />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 min-w-11 px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

export default BankDepositForm;
