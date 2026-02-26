import { memo, useState } from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

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
    <div className="bg-surface-2 border border-border-strong rounded-xl p-4 mt-4">
      <h3 className="text-lg font-semibold text-primary-main mb-4">
        Bank Deposit
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
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
          <Input
            compatibilityMode="no-wrapper"
            id="bankDeposit_amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-border-strong rounded-lg px-3 py-2"
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
          <Input
            compatibilityMode="no-wrapper"
            id="bankDeposit_keycards"
            type="number"
            step="1"
            value={keycardInput}
            onChange={(e) => setKeycardInput(e.target.value)}
            className="w-full border border-border-strong rounded-lg px-3 py-2"
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Current keycards in safe: {currentKeycards}
          </p>
        </div>

        <div className="mt-5">
          <PasswordReauthInline onSubmit={handleSubmit} submitLabel="Deposit" />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onCancel}
            className="min-h-11 min-w-11 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
});

export default BankDepositForm;
